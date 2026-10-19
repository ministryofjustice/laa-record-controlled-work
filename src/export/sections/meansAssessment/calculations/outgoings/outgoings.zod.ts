import * as zod from "zod";

const amountSchema = zod.number().nullish();
const proceedingTypesSchema = zod.array(
  zod.looseObject({ upper_threshold: zod.number() }),
);

const outgoingAmountsSchema = zod.looseObject({
  child_care: amountSchema,
  legal_aid: amountSchema,
  maintenance_out: amountSchema,
});

const employmentDeductionsSchema = zod.looseObject({
  fixed_employment_deduction: amountSchema,
  national_insurance: amountSchema,
  tax: amountSchema,
});

export const outgoingDetailsSchema = zod.looseObject({
  monthly_equivalents: zod.looseObject({
    all_sources: outgoingAmountsSchema,
  }),
});

export const partnerOutgoingSummarySchema = zod.looseObject({
  employment_income: employmentDeductionsSchema,
  partner_allowance: amountSchema,
});

export const outgoingsResultSchema = zod.looseObject({
  assessment: zod.looseObject({
    disposable_income: outgoingDetailsSchema,
    partner_capital: zod.unknown().optional(),
    partner_disposable_income: zod.unknown().optional(),
  }),
  result_summary: zod.looseObject({
    disposable_income: zod.looseObject({
      allowed_housing_costs: amountSchema,
      combined_total_disposable_income: amountSchema,
      combined_total_outgoings_and_allowances: amountSchema,
      dependant_allowance: amountSchema,
      employment_income: employmentDeductionsSchema,
      net_housing_costs: amountSchema,
      partner_allowance: amountSchema,
      proceeding_types: proceedingTypesSchema,
    }),
    partner_disposable_income: zod.unknown().optional(),
  }),
});

export type OutgoingDetails = zod.output<typeof outgoingDetailsSchema>;
export type OutgoingsResult = zod.output<typeof outgoingsResultSchema>;
