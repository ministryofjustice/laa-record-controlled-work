import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import type { getAllProviderOffices } from "#/api/clients/pda/schema/provider-firms-endpoints/provider-firms-endpoints.gen.js";

export interface Offices extends Record<string, unknown> {
  offices: ProviderFirmOfficeListDto;
}

export type OfficesContext = EffectFunctionContext<Offices>;

export interface SelectOfficeEffectsDeps {
  getAllProviderOffices: typeof getAllProviderOffices;
}
