import {
  defineEffectFunctions,
  type EffectFunctionExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { getApplications } from "#/api/client/schema/applications/applications.gen.js";

import { Applications } from "#/api/client/model/applications.zod.gen.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";

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
        console.log("Error fetching applications:", error);
        return;
      }

      if (response.status !== HTTP_STATUS.OK) {
        // TODO how to handle
        return;
      }

      const result = Applications.safeParse(response.data);
      if (!result.success) {
        // TODO how to handle
        return;
      }
      const caseList: Applications = result.data;

      context.setData("caseList", caseList);
    },
});
