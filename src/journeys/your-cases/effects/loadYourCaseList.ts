import type { SessionInterface } from "#/app/session.types.js";
import type {
  CaseListContext,
  YourCasesEffectsDeps,
} from "#/journeys/your-cases/your-cases.types.js";

import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { Applications } from "#/api/clients/rcw/model/applications.zod.gen.js";
import { getRcwApiDefaultOptions } from "#/api/getRcwApiDefaultOptions.js";
import { getAuthDebugHeaders } from "#/auth/auth.debug.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

export const loadYourCaseList =
  (deps: YourCasesEffectsDeps) => async (context: CaseListContext) => {
    let response;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Session shape is constrained by app session typing.
      const session = context.getSession() as SessionInterface | undefined;
      const opts = await getRcwApiDefaultOptions({
        homeAccountId: session?.msal?.homeAccountId,
        sessionId: session?.id,
      });
      response = await deps.getApplications(opts);
    } catch (error) {
      logger.error("Error fetching applications", error, {
        api: "getApplications",
      });
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.OK) {
      logger.error(
        "getApplications did not return 200",
        {
          authHeaders: getAuthDebugHeaders(response.headers),
          data: response.data,
          status: response.status,
        },
        {
          api: "getApplications",
        },
      );
      throw new ApiResponseError();
    }

    const result = Applications.safeParse(response.data);

    if (!result.success) {
      logger.error(
        "getApplications response data failed validation",
        result.error,
      );
      throw ApiValidationError.from(result.error);
    }
    const caseList: Applications = result.data;
    context.setData("caseList", caseList);
  };
