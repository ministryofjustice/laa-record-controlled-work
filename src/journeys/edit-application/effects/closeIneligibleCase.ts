import type {
  EditApplicationContext,
  EditApplicationEffectsDeps,
} from "#/journeys/edit-application/editApplication.types.js";

import { getRcwApiDefaultOptions } from "#/api/clients/getRcwApiDefaultOptions.js";
import {
  CONTEXT_DATA_KEYS,
  PARAMS_KEYS,
} from "#/journeys/journey.constants.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";

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

    const session = context.getSession();
    const options = await getRcwApiDefaultOptions({
      homeAccountId: session?.msal?.homeAccountId,
      sessionId: session?.id,
    });
    const response = await deps.updateApplicationStatus(
      applicationID,
      {
        applicationState: "COMPLETED",
        eTag: context.getData<number>(CONTEXT_DATA_KEYS.applicationETag),
      },
      options,
    );

    if (response.status !== HTTP_STATUS.NO_CONTENT) {
      throw new Error("updateApplicationStatus did not return 204");
    }
  };
