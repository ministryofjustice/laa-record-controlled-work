import type {
  EditApplicationContext,
  EditApplicationEffectsDeps,
} from "#/journeys/edit-application/editApplication.types.js";

import { ApiResponseError } from "#/api/clients/api.errors.js";
import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import { ApplicationState } from "#/api/clients/rcw/model/applicationState.zod.gen.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

export const submitApplication =
  (deps: EditApplicationEffectsDeps) =>
  async (context: EditApplicationContext): Promise<void> => {
    let response;

    try {
      const session = context.getSession();
      const applicationID = context.getData(CONTEXT_DATA_KEYS.application).id;
      const opts = await getRcwApiDefaultOptions({
        homeAccountId: session?.msal?.homeAccountId,
        sessionId: session?.id,
      });

      response = await deps.updateApplicationStatus(
        applicationID,
        { applicationState: ApplicationState.enum.COMPLETED },
        opts,
      );
    } catch (error) {
      logger.error("Error submitting application", error, {
        api: "updateApplicationStatus",
      });
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.NO_CONTENT) {
      logger.error(
        "updateApplicationStatus did not return 204",
        {
          authHeaders: getAuthDebugHeaders(response.headers),
          data: response.data,
          status: response.status,
        },
        {
          api: "updateApplicationStatus",
        },
      );
      throw new ApiResponseError();
    }
  };
