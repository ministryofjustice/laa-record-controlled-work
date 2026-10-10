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
import { validateApplicationETag } from "#/journeys/edit-application/applicationETag.js";
import {
  CONTEXT_DATA_KEYS,
  PARAMS_KEYS,
} from "#/journeys/journey.constants.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import * as metrics from "#/lib/metrics.js";
import { logger } from "#/logger.js";

export const loadApplication =
  (deps: EditApplicationEffectsDeps) =>
  async (context: EditApplicationContext): Promise<void> => {
    const applicationID = context.getRequestParam(PARAMS_KEYS.applicationID);
    if (!applicationID) {
      logger.error("applicationID parameter is missing", undefined, {
        api: "getApplication",
        errorCategory: "missing_parameter",
      });
      throw new ApiResponseError();
    }

    let response;
    try {
      const session = context.getSession();
      const correlationId = context
        .getRequestHeader("x-correlation-id")
        ?.toString();

      const opts = await getRcwApiDefaultOptions({
        correlationId,
        homeAccountId: session?.msal?.homeAccountId,
        sessionId: session?.id,
      });
      response = await metrics.time(
        "getApplication",
        async () => await deps.getApplication(applicationID, opts),
      );
    } catch {
      logger.error("Error fetching application", undefined, {
        api: "getApplication",
        errorCategory: "fetch",
      });
      throw new ApiResponseError();
    }

    if (response.status !== HTTP_STATUS.OK) {
      logger.error("getApplication did not return 200", undefined, {
        api: "getApplication",
        errorCategory: "http_response",
        status: response.status,
      });
      throw new ApiResponseError();
    }

    const result = Application.safeParse(response.data);

    if (!result.success) {
      logger.error(
        "getApplication response data failed validation",
        undefined,
        {
          api: "getApplication",
          errorCategory: "schema_validation",
          issues: result.error.issues.map(({ code, path }) => ({ code, path })),
        },
      );
      throw new ApiValidationError();
    }

    const application: Application = result.data;
    const applicationETag = getApplicationETag(response.headers);

    context.setData(CONTEXT_DATA_KEYS.application, application);
    context.setData(CONTEXT_DATA_KEYS.applicationETag, applicationETag);
  };

/**
 * Validates the API ETag and logs only its failure category.
 * @param headers Response headers from the application GET.
 * @returns The exact validated ETag.
 */
function getApplicationETag(headers: Headers): string {
  try {
    return validateApplicationETag(headers.get("etag"));
  } catch {
    logger.error("getApplication ETag failed validation", undefined, {
      api: "getApplication",
      errorCategory: "invalid_etag",
    });
    throw new ApiResponseError();
  }
}
