import * as zod from "zod";

const amountSchema = zod.number().nullish();
const proceedingTypesSchema = zod.array(
  zod.looseObject({ upper_threshold: zod.number() }),
);

export const clientCapitalSummarySchema = zod.looseObject({
  combined_assessed_capital: amountSchema,
  disputed_non_property_disregard: amountSchema,
  pensioner_disregard_applied: amountSchema,
  proceeding_types: proceedingTypesSchema,
  subject_matter_of_dispute_disregard: zod.number(),
  total_capital: amountSchema,
  total_liquid: amountSchema,
  total_non_liquid: amountSchema,
  total_property: amountSchema,
});

export const capitalResultSummarySchema = zod.looseObject({
  result_summary: zod.looseObject({
    capital: clientCapitalSummarySchema,
    partner_capital: zod.unknown().optional(),
  }),
});

export const clientAdultCapitalSchema = zod.looseObject({
  total_capital_with_smod: amountSchema,
});

export const partnerCapitalSummarySchema = zod.looseObject({
  pensioner_disregard_applied: amountSchema,
  total_capital_with_smod: amountSchema,
  total_liquid: amountSchema,
  total_non_liquid: amountSchema,
  total_property: amountSchema,
});

export type ClientCapitalSummary = zod.output<typeof clientAdultCapitalSchema> &
  zod.output<typeof clientCapitalSummarySchema>;
export type PartnerCapitalSummary = zod.output<
  typeof partnerCapitalSummarySchema
>;
