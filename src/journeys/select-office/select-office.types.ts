import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { getAllProviderOffices } from "#/api/clients/pda/schema/provider-firms-endpoints/provider-firms-endpoints.gen.js";
import type { Office } from "#/dto/office/office.dto.js";
import type { JourneySession } from "#/journeys/context.type.js";

export interface SelectOfficeAnswers extends Record<string, unknown> {
  selectOffice: string;
}

export type SelectOfficeContext = EffectFunctionContext<
  SelectOfficeData,
  SelectOfficeAnswers,
  JourneySession
>;

export interface SelectOfficeData extends Record<string, unknown> {
  officeList: Office[];
}

export interface SelectOfficeEffectsDeps {
  getAllProviderOffices: typeof getAllProviderOffices;
}
