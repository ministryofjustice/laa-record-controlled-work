import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { Applications } from "#/api/clients/rcw/model/applications.zod.gen.js";
import type { getApplications } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { OfficeData } from "#/dto/office/office.dto.js";
import type { JourneySession } from "#/journeys/context.type.js";

export type CaseListContext = EffectFunctionContext<
  CaseListData,
  Record<string, unknown>,
  JourneySession
>;

export interface CaseListData extends Record<string, unknown> {
  caseList: Applications;
  selectOffice: OfficeData;
}

export interface YourCasesEffectsDeps {
  getApplications: typeof getApplications;
}
