import type {
  CaseListContext,
  YourCasesEffectsDeps,
} from "#/journeys/your-cases/your-cases.types.js";

import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";
import { Applications } from "#/api/clients/rcw/model/applications.zod.gen.js";

export const loadYourCaseList =
  (deps: YourCasesEffectsDeps) => async (context: CaseListContext) => {
    let response;

    try {
      response = await deps.getApplications();
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
