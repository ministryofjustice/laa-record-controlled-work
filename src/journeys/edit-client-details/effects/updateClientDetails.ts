import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type {
  EditApplicationContext,
  EditApplicationEffectsDeps,
} from "#/journeys/edit-application/editApplication.types.js";

import {
  ApiResponseError,
  ApiValidationError,
} from "#/api/clients/api.errors.js";
import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { UpdateApplicationDetailsHeaders } from "#/api/clients/rcw/model/updateApplicationDetailsHeaders.zod.gen.js";
import { UpdateApplicationDetailsRequestBody } from "#/api/clients/rcw/model/updateApplicationDetailsRequestBody.zod.gen.js";
import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import { Answers } from "#/journeys/create-application/data/answers.zod.js";
import {
  CONTEXT_DATA_KEYS,
  PARAMS_KEYS,
} from "#/journeys/journey.constants.js";
import { getJourneyDraftKey } from "#/journeys/journeyDraftKey.js";
import { getSessionDataOrThrow } from "#/journeys/shared.helper.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import * as metrics from "#/lib/metrics.js";
import { logger } from "#/logger.js";

/** Builds a complete validated update body from the saved journey draft.
 * @param journeyAnswers - Draft answers associated with this application.
 * @param application - Loaded application supplying create-only mapping context.
 * @returns Schema-validated editable details snapshot.
 */
function buildDetailsRequestBody(
  journeyAnswers: Record<string, unknown>,
  application: Application,
): UpdateApplicationDetailsRequestBody {
  const parsedAnswers = Answers.safeParse(journeyAnswers);
  if (!parsedAnswers.success) {
    throw ApiValidationError.from(parsedAnswers.error);
  }

  const requestBody = ApplicationDto.fromAnswers(
    parsedAnswers.data,
    application.providerOfficeCode,
  ).toDetailsRequest(parsedAnswers.data.ecf === "yes");
  const parsedRequestBody =
    UpdateApplicationDetailsRequestBody.safeParse(requestBody);
  if (!parsedRequestBody.success) {
    throw ApiValidationError.from(parsedRequestBody.error);
  }

  return parsedRequestBody.data;
}

/** Validates and preserves the strong ETag captured by this draft.
 * @param version - Original draft ETag.
 * @returns Unchanged strong ETag for the If-Match header.
 */
function getIfMatchVersion(version: string | undefined): string {
  if (typeof version !== "string") {
    throw new ApiValidationError();
  }

  const parsedHeaders = UpdateApplicationDetailsHeaders.safeParse({
    "If-Match": version,
  });
  if (!parsedHeaders.success) {
    throw ApiValidationError.from(parsedHeaders.error);
  }

  return version;
}

export const updateClientDetails =
  (deps: EditApplicationEffectsDeps) =>
  async (
    context: EditApplicationContext,
    journeyCode: string,
  ): Promise<void> => {
    let response;
    try {
      const session = getSessionDataOrThrow(context);
      const applicationId = context.getRequestParam(PARAMS_KEYS.applicationID);
      if (!applicationId) {
        throw new ApiValidationError();
      }

      const draftKey = getJourneyDraftKey(context, journeyCode);
      const journeyAnswers = session.journeyDrafts?.[draftKey];
      if (!journeyAnswers) {
        throw new ApiValidationError();
      }

      const version = getIfMatchVersion(
        session.journeyDraftVersions?.[draftKey],
      );
      const application = context.getData(CONTEXT_DATA_KEYS.application);
      const requestBody = buildDetailsRequestBody(journeyAnswers, application);

      const correlationId = context
        .getRequestHeader("x-correlation-id")
        ?.toString();
      const options = await getRcwApiDefaultOptions({
        correlationId,
        homeAccountId: session.msal?.homeAccountId,
        sessionId: session.id,
      });
      const headers = new Headers(options.headers);
      headers.set("If-Match", version);

      response = await metrics.time(
        "updateApplicationDetails",
        async () =>
          await deps.updateApplicationDetails(applicationId, requestBody, {
            ...options,
            headers,
          }),
        (status) => status === HTTP_STATUS.NO_CONTENT,
      );
    } catch (error) {
      logger.error(
        `Error updating client details for journey ${journeyCode}`,
        undefined,
        { api: "updateApplicationDetails" },
      );
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.NO_CONTENT) {
      logger.error(
        "updateApplicationDetails did not return 204",
        {
          authHeaders: getAuthDebugHeaders(response.headers),
          status: response.status,
        },
        { api: "updateApplicationDetails" },
      );
      throw new ApiResponseError();
    }
  };
