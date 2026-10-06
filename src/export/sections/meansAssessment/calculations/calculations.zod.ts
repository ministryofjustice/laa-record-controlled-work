import * as zod from "zod";

import { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

const CFE_OUTCOMES = [
  "eligible",
  "contribution_required",
  "ineligible",
  "not_calculated",
] as const;

const cfeProceedingTypeSchema = zod.looseObject({
  result: zod.enum(CFE_OUTCOMES),
  upper_threshold: zod.number(),
});

const cfeCategorySchema = zod.looseObject({
  combined_assessed_capital: zod.number().nullish(),
  combined_total_disposable_income: zod.number().nullish(),
  combined_total_gross_income: zod.number().nullish(),
  proceeding_types: zod.array(cfeProceedingTypeSchema).nullish(),
});

const resultSummarySchema = zod
  .looseObject({
    capital: cfeCategorySchema.nullish(),
    disposable_income: cfeCategorySchema.nullish(),
    gross_income: cfeCategorySchema.nullish(),
    overall_result: zod
      .looseObject({
        capital_contribution: zod.number().nullish(),
        income_contribution: zod.number().nullish(),
        result: zod.string().nullish(),
      })
      .nullish(),
  })
  .nullish();

export const cfeResultSchema = zod.looseObject({
  result_summary: resultSummarySchema,
});

export const exemptionAnswersSchema = EligibilityData.pick({
  aggregated_means: true,
  asylum_support: true,
  client_age: true,
  controlled_legal_representation: true,
  immigration_or_asylum: true,
  passporting: true,
  regular_income: true,
  under_eighteen_assets: true,
});

export type CfeCategory = zod.output<typeof cfeCategorySchema>;
export type CfeResultSummary = NonNullable<
  zod.output<typeof resultSummarySchema>
>;
