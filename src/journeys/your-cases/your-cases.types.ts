import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { Applications } from "#/api/client/model/applications.zod.gen.js";
import type { RcwApiClient } from "#/api/rcw-api.client.js";

export interface CaseList extends Record<string, unknown> {
  caseList: Applications;
}

export type CaseListContext = EffectFunctionContext<CaseList>;

export interface YourCasesEffectsDeps {
  rcwApiClient: Pick<RcwApiClient, "getApplications">;
}
