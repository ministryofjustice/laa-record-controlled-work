import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import { z } from "zod";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import type { getAllProviderOffices } from "#/api/clients/pda/schema/provider-firms-endpoints/provider-firms-endpoints.gen.js";

export type OfficeDto = NonNullable<
  ProviderFirmOfficeListDto["offices"]
>[number];

export interface Offices extends Record<string, unknown> {
  officeList: Office[];
}

export interface SelectOfficeEffectsDeps {
  getAllProviderOffices: typeof getAllProviderOffices;
}

export type SelectOfficesContext = EffectFunctionContext<Offices>;

/**
 * Schema for the mapped office output
 */
export const OfficeSchema = z.object({
  address: z.string(),
  code: z.string(),
  officeName: z.string(),
  postCode: z.string(),
});

export const OFFICE_FIELD = OfficeSchema.keyof().enum;

export type Office = z.infer<typeof OfficeSchema>;

export type SelectOfficeSession = ReturnType<
  SelectOfficesContext["getSession"]
>;
