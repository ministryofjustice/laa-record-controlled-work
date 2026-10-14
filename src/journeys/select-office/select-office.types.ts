import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import z from "zod";

import type { getFirmOffice } from "#/api/clients/pda/schema/provider-firm-offices/provider-firm-offices.gen.js";
import type { JourneySession } from "#/journeys/context.type.js";
import type { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export const OfficeSchema = z.object({
  address: z.string().optional(),
  code: z.string(),
  firmName: z.string().optional(),
});

export const OFFICE_KEY = OfficeSchema.keyof().enum;

export type Office = z.infer<typeof OfficeSchema>;

export interface SelectOfficeAnswers extends Record<string, unknown> {
  selectOffice: string;
}

export type SelectOfficeContext = EffectFunctionContext<
  SelectOfficeData,
  SelectOfficeAnswers,
  JourneySession
>;

export interface SelectOfficeData extends Record<string, unknown> {
  [CONTEXT_DATA_KEYS.availableOffices]: Office[];
  [CONTEXT_DATA_KEYS.selectedOffice]: Office;
}

export interface SelectOfficeEffectsDeps {
  getFirmOffice: typeof getFirmOffice;
}
