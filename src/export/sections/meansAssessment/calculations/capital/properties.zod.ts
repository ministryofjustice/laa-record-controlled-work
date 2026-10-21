import * as zod from "zod";

const amountSchema = zod.number().nullish();

const propertySchema = zod.looseObject({
  assessed_equity: amountSchema,
  main_home_equity_disregard: amountSchema,
  net_equity: amountSchema,
  outstanding_mortgage: amountSchema,
  percentage_owned: zod.number(),
  smod_allowance: amountSchema,
  transaction_allowance: amountSchema,
  value: amountSchema,
});

export const clientPropertiesSchema = zod.looseObject({
  additional_properties: zod.array(propertySchema),
  main_home: propertySchema.nullish(),
});

export const partnerPropertiesSchema = zod.looseObject({
  additional_properties: zod.array(propertySchema),
});

export const capitalBranchSchema = zod.looseObject({
  capital_items: zod.unknown().optional(),
});

export const capitalItemsSchema = zod.looseObject({
  properties: zod.unknown().optional(),
});

export const propertyAssessmentDetailsSchema = zod.looseObject({
  assessment: zod
    .looseObject({
      capital: zod.unknown().optional(),
      partner_capital: zod.unknown().optional(),
    })
    .nullish()
    .optional(),
});

export type CfeClientProperties = zod.output<typeof clientPropertiesSchema>;
export type CfePartnerProperties = zod.output<typeof partnerPropertiesSchema>;
export type CfeProperty = zod.output<typeof propertySchema>;
