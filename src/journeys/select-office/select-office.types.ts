import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import { z } from "zod";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import type { getAllProviderOffices } from "#/api/clients/pda/schema/provider-firms-endpoints/provider-firms-endpoints.gen.js";
import type { JourneySession } from "#/journeys/context.type.js";

export type PdaOffice = NonNullable<
  ProviderFirmOfficeListDto["offices"]
>[number];

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
