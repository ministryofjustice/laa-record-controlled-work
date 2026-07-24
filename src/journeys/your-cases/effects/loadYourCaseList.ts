import type { SessionInterface } from "#/app/session.types.js";
import type {
  CaseListContext,
  YourCasesEffectsDeps,
} from "#/journeys/your-cases/your-cases.types.js";

import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { Applications } from "#/api/client/model/applications.zod.gen.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

export const loadYourCaseList =
  (deps: YourCasesEffectsDeps) => async (context: CaseListContext) => {
    let response;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Defining correctly as our session definition.
      const session = context.getSession() as SessionInterface;
      const token: string | undefined = session.account?.idToken;

      if (token === undefined) {
        logger.error(
          "Failed to get expected idToken from session, user may not be authenticated",
          undefined,
        );
        throw new NotAuthenticatedError();
      }

      const opts: RequestInit = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      response = await deps.getApplications(opts);
    } catch (error) {
      logger.error("Error fetching applications", error, {
        api: "getApplications",
      });
      throw ApiResponseError.from(error);
    }

    if (response.status !== HTTP_STATUS.OK) {
      logger.error("getApplications did not return 200", response, {
        api: "getApplications",
      });
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
