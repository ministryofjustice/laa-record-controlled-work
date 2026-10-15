import * as zod from "zod";

const amountSchema = zod.number().nullish();
const proceedingTypesSchema = zod.array(
  zod.looseObject({ upper_threshold: zod.number() }),
);

export const incomeSourcesSchema = zod.looseObject({
  irregular_income: zod.looseObject({
    monthly_equivalents: zod.looseObject({
      student_loan: amountSchema,
      unspecified_source: amountSchema,
    }),
  }),
  other_income: zod.looseObject({
    monthly_equivalents: zod.looseObject({
      all_sources: zod.looseObject({
        friends_or_family: amountSchema,
        maintenance_in: amountSchema,
        pension: amountSchema,
        property_or_lodger: amountSchema,
      }),
    }),
  }),
  state_benefits: zod.looseObject({
    monthly_equivalents: zod.looseObject({ all_sources: amountSchema }),
  }),
});

export const employmentIncomeSchema = zod.looseObject({
  employment_income: zod.looseObject({ gross_income: amountSchema }),
});

export const incomeResultSchema = zod.looseObject({
  assessment: zod.looseObject({
    gross_income: zod.unknown(),
    partner_capital: zod.unknown().optional(),
    partner_gross_income: zod.unknown().optional(),
  }),
  result_summary: zod.looseObject({
    disposable_income: zod.unknown(),
    gross_income: zod.looseObject({
      proceeding_types: proceedingTypesSchema,
    }),
    partner_disposable_income: zod.unknown().optional(),
  }),
});

export type IncomeSources = zod.output<typeof incomeSourcesSchema>;
