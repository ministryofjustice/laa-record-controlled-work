import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { Applications } from "#/api/clients/rcw/model/applications.zod.gen.js";
import type { getApplications } from "#/api/clients/rcw/schema/applications/applications.gen.js";

export interface CaseList extends Record<string, unknown> {
  caseList: Applications;
}

export type CaseListContext = EffectFunctionContext<CaseList>;

export interface YourCasesEffectsDeps {
  getApplications: typeof getApplications;
}
