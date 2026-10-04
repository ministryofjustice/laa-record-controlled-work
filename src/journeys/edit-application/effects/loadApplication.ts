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
import { parseApplicationETag } from "#/lib/applicationETag.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import * as metrics from "#/lib/metrics.js";
import { logger } from "#/logger.js";

export const loadApplication =
  (deps: EditApplicationEffectsDeps) =>
  async (context: EditApplicationContext): Promise<void> => {
    let response;
    try {
      const session = context.getSession();
      const applicationID = context.getRequestParam(PARAMS_KEYS.applicationID);

      if (!applicationID) {
        logger.error("applicationID parameter is missing");
        throw new Error("applicationID parameter is required");
      }

      const opts = await getRcwApiDefaultOptions({
        homeAccountId: session?.msal?.homeAccountId,
        sessionId: session?.id,
      });
      response = await metrics.time(
        "getApplication",
        async () => await deps.getApplication(applicationID, opts),
      );
    } catch (error) {
      logger.error("Error fetching application", { api: "getApplication" });
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.OK) {
      logger.error(
        "getApplication did not return 200",
        {
          authHeaders: getAuthDebugHeaders(response.headers),
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
      const issues = result.error.issues.map(({ code, path }) => ({
        code,
        path,
      }));
      logger.error("getApplication response data failed validation", {
        issues,
      });
      throw ApiValidationError.from(result.error);
    }

    const application: Application = result.data;
    const headers = response.headers as Headers | undefined;
    const eTag = headers?.get("etag");
    let applicationETag: string;
    try {
      applicationETag = parseApplicationETag(eTag);
    } catch {
      logger.error("getApplication returned an invalid ETag", {
        api: "getApplication",
        hasETag: typeof eTag === "string",
        status: response.status,
      });
      throw new ApiResponseError();
    }

    context.setData(CONTEXT_DATA_KEYS.application, application);
    context.setData(CONTEXT_DATA_KEYS.applicationETag, applicationETag);
  };
