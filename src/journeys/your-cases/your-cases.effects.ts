import {
  defineEffectFunctions,
  type EffectFunctionExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { getApplications } from "#/api/client/schema/applications/applications.gen.js";

import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { Applications } from "#/api/client/model/applications.zod.gen.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

export interface YourCasesEffectsDeps {
  getApplications: typeof getApplications;
}

interface YourCasesEffectShape {
  LoadYourCaseList: () => EffectFunctionExpr;
}

export const {
  effects: YourCasesEffects,
  implementations: YourCasesEffectImplementations,
} = defineEffectFunctions<YourCasesEffectShape, YourCasesEffectsDeps>({
  LoadYourCaseList:
    ({ getApplications }) =>
    async (context) => {
      let response;

      try {
        response = await getApplications();
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
    },
});
