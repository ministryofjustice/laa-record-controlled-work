/* eslint-disable @typescript-eslint/no-magic-numbers -- representative saved values */
/* eslint-disable jsdoc/require-jsdoc -- fixture builders are self-describing */
import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { EligibilityDataBenefit } from "#/api/clients/rcw/model/eligibilityDataBenefit.zod.gen.js";
import type { EligibilityDataIncome } from "#/api/clients/rcw/model/eligibilityDataIncome.zod.gen.js";
import type { EligibilityDataProperty } from "#/api/clients/rcw/model/eligibilityDataProperty.zod.gen.js";

export interface MeansAssessmentScenario {
  eligibility: null | {
    data: EligibilityData;
    result: null | Record<string, unknown>;
  };
  meansAssessmentRequired: boolean;
}

export function createBaselineAnswers(): EligibilityData {
  return {
    additional_property_owned: "none",
    adult_dependants: false,
    bank_accounts: [],
    benefits: [],
    child_dependants: false,
    childcare_payments_relevant: false,
    client_age: "standard",
    employment_status: "unemployed",
    friends_or_family_relevant: false,
    housing_benefit_relevant: false,
    housing_payments: 0,
    housing_payments_frequency: "monthly",
    immigration_or_asylum: false,
    investments_relevant: false,
    legal_aid_payments_relevant: false,
    level_of_help: "controlled",
    maintenance_payments_relevant: false,
    maintenance_relevant: false,
    other_relevant: false,
    partner: false,
    passporting: false,
    pension_relevant: false,
    property_or_lodger_relevant: false,
    property_owned: "none",
    receives_benefits: false,
    student_finance_relevant: false,
    valuables_relevant: false,
  };
}

export function createBenefit(
  type: string,
  amount: number,
  frequency: string,
): EligibilityDataBenefit {
  return {
    benefit_amount: amount,
    benefit_frequency: frequency,
    benefit_type: type,
  };
}

export function createIncome(
  grossIncome: number,
  frequency: string,
  type: string,
  deductions: [incomeTax: number, nationalInsurance: number] = [0, 0],
): EligibilityDataIncome {
  return {
    gross_income: grossIncome,
    income_frequency: frequency,
    income_tax: deductions[0],
    income_type: type,
    national_insurance: deductions[1],
  };
}

export function createKeyTotalsResult(): Record<string, unknown> {
  return {
    result_summary: {
      capital: {
        combined_assessed_capital: 0,
        proceeding_types: [
          { result: "eligible", upper_threshold: 999_999_999_999 },
        ],
      },
      disposable_income: {
        combined_total_disposable_income: 0,
        proceeding_types: [{ result: "eligible", upper_threshold: 733 }],
      },
      gross_income: {
        combined_total_gross_income: 0,
        proceeding_types: [{ result: "eligible", upper_threshold: 2_657 }],
      },
      overall_result: { result: "eligible" },
    },
  };
}

export function createMeansAssessment(
  answers: Partial<EligibilityData> = {},
  result: null | Record<string, unknown> = createKeyTotalsResult(),
  meansAssessmentRequired = true,
): MeansAssessmentScenario {
  return {
    eligibility: {
      data: { ...createBaselineAnswers(), ...structuredClone(answers) },
      result: structuredClone(result),
    },
    meansAssessmentRequired,
  };
}

export function createPartnerAnswers(): Partial<EligibilityData> {
  return {
    additional_property_owned: "none",
    partner: true,
    partner_additional_properties: [],
    partner_additional_property_owned: "none",
    partner_bank_accounts: [],
    partner_benefits: [],
    partner_childcare_payments_relevant: false,
    partner_employment_status: "unemployed",
    partner_friends_or_family_relevant: false,
    partner_investments_relevant: false,
    partner_legal_aid_payments_relevant: false,
    partner_maintenance_payments_relevant: false,
    partner_maintenance_relevant: false,
    partner_other_relevant: false,
    partner_over_60: false,
    partner_pension_relevant: false,
    partner_property_or_lodger_relevant: false,
    partner_receives_benefits: false,
    partner_student_finance_relevant: false,
    partner_valuables_relevant: false,
  };
}

export function createProperty(
  houseValue: number,
  percentageOwned: number,
  options: {
    disputed?: boolean;
    inlineMortgage?: boolean;
    mortgage?: number;
  } = {},
): EligibilityDataProperty {
  const { disputed, inlineMortgage, mortgage } = options;

  return {
    house_value: houseValue,
    percentage_owned: percentageOwned,
    ...(disputed === undefined ? {} : { house_in_dispute: disputed }),
    ...(inlineMortgage === undefined
      ? {}
      : { inline_owned_with_mortgage: inlineMortgage }),
    ...(typeof mortgage === "number" ? { mortgage } : {}),
  };
}
