import type {
  EditApplicationContext,
  EditApplicationEffectsDeps,
} from "#/journeys/edit-application/editApplication.types.js";

import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import {
  CONTEXT_DATA_KEYS,
  PARAMS_KEYS,
} from "#/journeys/journey.constants.js";
import { parseApplicationVersion } from "#/lib/applicationVersion.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import * as metrics from "#/lib/metrics.js";
import { logger } from "#/logger.js";

export const closeIneligibleCase =
  (deps: EditApplicationEffectsDeps) =>
  async (context: EditApplicationContext): Promise<void> => {
    if (context.getPostData<string>("action") !== "close") {
      return;
    }

    const applicationID = context.getRequestParam(PARAMS_KEYS.applicationID);
    if (!applicationID) {
      throw new Error("applicationID parameter is required");
    }

    const correlationId = context
      .getRequestHeader("x-correlation-id")
      ?.toString();

    let eTag: number;
    try {
      eTag = parseApplicationVersion(
        context.getData(CONTEXT_DATA_KEYS.applicationETag),
      );
    } catch (error) {
      logger.error(
        "Cannot close ineligible case with an invalid application ETag",
        error,
        {
          correlationId,
          reason:
            error instanceof Error
              ? error.message
              : "Unknown ETag validation failure",
        },
      );
      throw error;
    }

    const session = context.getSession();
    const options = await getRcwApiDefaultOptions({
      correlationId,
      homeAccountId: session?.msal?.homeAccountId,
      sessionId: session?.id,
    });

    const body = {
      applicationState: "COMPLETED" as const,
      eTag,
    };
    const response = await metrics.time(
      "updateApplicationStatus",
      async () =>
        await deps.updateApplicationStatus(applicationID, body, options),
    );

    if (response.status !== HTTP_STATUS.NO_CONTENT) {
      throw new Error("updateApplicationStatus did not return 204");
    }
  };
