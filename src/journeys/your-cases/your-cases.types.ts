import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { Applications } from "#/api/clients/rcw/model/applications.zod.gen.js";
import type { getApplications } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { JourneySession } from "#/journeys/context.type.js";
import type { Office } from "#/journeys/select-office/select-office.types.js";

export type CaseListContext = EffectFunctionContext<
  CaseListData,
  Record<string, unknown>,
  JourneySession
>;

export interface CaseListData extends Record<string, unknown> {
  caseList: Applications;
  selectOffice: Office;
}

export interface YourCasesEffectsDeps {
  getApplications: typeof getApplications;
}
