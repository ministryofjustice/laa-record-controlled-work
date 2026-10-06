import type {
  EditApplicationContext,
  EditApplicationEffectsDeps,
} from "#/journeys/edit-application/editApplication.types.js";

import {
  ApiResponseError,
  ApiValidationError,
} from "#/api/clients/api.errors.js";
import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import {
  CONTEXT_DATA_KEYS,
  PARAMS_KEYS,
} from "#/journeys/journey.constants.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import * as metrics from "#/lib/metrics.js";
import { logger } from "#/logger.js";

const DEFAULT_ETAG = 0;

export const loadApplication =
  (deps: EditApplicationEffectsDeps) =>
  async (context: EditApplicationContext): Promise<void> => {
    let response;
    try {
      const session = context.getSession();
      const applicationID = context.getRequestParam(PARAMS_KEYS.applicationID);
      const correlationId = context
        .getRequestHeader("x-correlation-id")
        ?.toString();
      if (!applicationID) {
        logger.error("applicationID parameter is missing");
        throw new Error("applicationID parameter is required");
      }

      const opts = await getRcwApiDefaultOptions({
        correlationId,
        homeAccountId: session?.msal?.homeAccountId,
        sessionId: session?.id,
      });
      response = await metrics.time(
        "getApplication",
        async () => await deps.getApplication(applicationID, opts),
      );
    } catch (error) {
      logger.error("Error fetching application", error, {
        api: "getApplication",
      });
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.OK) {
      logger.error(
        "getApplication did not return 200",
        {
          authHeaders: getAuthDebugHeaders(response.headers),
          data: response.data,
          status: response.status,
        },
        {
          api: "getApplication",
        },
      );
      throw new ApiResponseError();
    }

    const result = Application.safeParse(response.data);

    if (!result.success) {
      logger.error(
        "getApplication response data failed validation",
        result.error,
      );
      throw ApiValidationError.from(result.error);
    }

    const application: Application = result.data;
    context.setData(CONTEXT_DATA_KEYS.application, application);
    context.setData(
      CONTEXT_DATA_KEYS.applicationETag,
      getApplicationETag(response.headers as Headers | undefined),
    );
  };

/**
 * Retrieves the ETag value from the API response headers.
 * @param headers - The headers from the API response.
 * @returns The ETag value as a number, or the default ETag if not present.
 */
function getApplicationETag(headers: Headers | undefined): number {
  const eTag = headers?.get("etag");

  if (!eTag) {
    return DEFAULT_ETAG;
  }

  return Number.parseInt(eTag, 10);
}
