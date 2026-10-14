/* eslint-disable @typescript-eslint/no-magic-numbers -- representative financial fixture values */
/* eslint-disable jsdoc/require-jsdoc -- test fixture helpers are self-describing */
import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { EligibilityDataBenefit } from "#/api/clients/rcw/model/eligibilityDataBenefit.zod.gen.js";
import type { EligibilityDataIncome } from "#/api/clients/rcw/model/eligibilityDataIncome.zod.gen.js";
import type { EligibilityDataProperty } from "#/api/clients/rcw/model/eligibilityDataProperty.zod.gen.js";

export enum MeansAssessmentScenarioName {
  AsylumSupport = "asylumSupport",
  Baseline = "baseline",
  CalculationStates = "calculationStates",
  EmployedHousehold = "employedHousehold",
  FormattingVariants = "formattingVariants",
  HousingMortgage = "housingMortgage",
  HousingSharedOwnership = "housingSharedOwnership",
  MissingEligibility = "missingEligibility",
  OtherIncomeAndOutgoings = "otherIncomeAndOutgoings",
  Passporting = "passporting",
  PropertiesAndAssets = "propertiesAndAssets",
  StaleInactiveAnswers = "staleInactiveAnswers",
  UnavailableResult = "unavailableResult",
  Under18ControlledClr = "under18ControlledClr",
  Under18NoMeans = "under18NoMeans",
  UnsupportedMeansAssessment = "unsupportedMeansAssessment",
}

interface MeansAssessmentScenario {
  eligibility: null | {
    data: EligibilityData;
    result: null | Record<string, unknown>;
  };
  meansAssessmentRequired: boolean;
}

function baselineAnswers(): EligibilityData {
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

function createMeansAssessment(
  answers: Partial<EligibilityData> = {},
  result: null | Record<string, unknown> = savedResult(),
  meansAssessmentRequired = true,
): MeansAssessmentScenario {
  return {
    eligibility: {
      data: { ...baselineAnswers(), ...answers },
      result,
    },
    meansAssessmentRequired,
  };
}

function exemptResult(): Record<string, unknown> {
  return { result_summary: { overall_result: { result: "eligible" } } };
}

function partnerAnswers(): Partial<EligibilityData> {
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

function savedBenefit(
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

function savedIncome(
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

function savedProperty(
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

function savedResult(): Record<string, unknown> {
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

export const meansAssessmentScenarios: Record<
  MeansAssessmentScenarioName,
  () => MeansAssessmentScenario
> = {
  [MeansAssessmentScenarioName.AsylumSupport]: () =>
    createMeansAssessment(
      { asylum_support: true, immigration_or_asylum: true },
      exemptResult(),
    ),
  [MeansAssessmentScenarioName.Baseline]: () => createMeansAssessment(),
  [MeansAssessmentScenarioName.CalculationStates]: () =>
    createMeansAssessment(
      {},
      {
        result_summary: {
          capital: {
            combined_assessed_capital: -250,
            proceeding_types: [
              { result: "eligible", upper_threshold: 999_999_999_999 },
            ],
          },
          disposable_income: undefined,
          gross_income: {
            combined_total_gross_income: null,
            proceeding_types: [{ result: "eligible", upper_threshold: 2_657 }],
          },
          overall_result: { result: "eligible" },
        },
      },
    ),
  [MeansAssessmentScenarioName.EmployedHousehold]: () =>
    createMeansAssessment({
      ...partnerAnswers(),
      adult_dependants: true,
      adult_dependants_count: 1,
      benefits: [
        savedBenefit("Child Benefit", 84.2, "monthly"),
        savedBenefit("Disability benefit", 22, "every_four_weeks"),
      ],
      child_dependants: true,
      child_dependants_count: 2,
      client_age: "over_60",
      dependant_incomes: [
        { amount: 12.5, frequency: "monthly" },
        { amount: 8, frequency: "every_week" },
      ],
      dependants_get_income: true,
      employment_status: "in_work",
      incomes: [
        savedIncome(2_450, "monthly", "employment", [300, 120]),
        savedIncome(125.5, "monthly", "statutory_pay"),
      ],
      partner_benefits: [savedBenefit("Carer benefit", 65, "every_two_weeks")],
      partner_employment_status: "in_work",
      partner_incomes: [
        savedIncome(1_800, "every_four_weeks", "self_employment", [210, 80]),
      ],
      partner_over_60: true,
      partner_receives_benefits: true,
      receives_benefits: true,
    }),
  [MeansAssessmentScenarioName.FormattingVariants]: () =>
    createMeansAssessment({
      additional_properties: [
        savedProperty(123_456.78, 37),
        savedProperty(9_999.99, 100, { inlineMortgage: false }),
      ],
      additional_property_owned: "outright",
      bank_accounts: [{ amount: 1_234.56 }, { amount: 1_234.56 }],
      benefits: [
        savedBenefit("Benefit A", 1_200.5, "every_week"),
        savedBenefit("Benefit B", 80, "every_two_weeks"),
        savedBenefit("Benefit C", 42, "every_four_weeks"),
        savedBenefit("Benefit D", 20, "monthly"),
      ],
      employment_status: "in_work",
      friends_or_family_conditional_value: 1_234.56,
      friends_or_family_frequency: "total",
      friends_or_family_relevant: true,
      housing_benefit_frequency: "monthly",
      housing_benefit_relevant: true,
      housing_benefit_value: 320,
      housing_payments: 1_500.25,
      housing_payments_frequency: "every_four_weeks",
      incomes: [
        savedIncome(1_234.56, "every_week", "employment", [100.25, 80.1]),
        savedIncome(2_345.67, "every_two_weeks", "self_employment", [200, 90]),
        savedIncome(3_456.78, "every_four_weeks", "statutory_pay", [300, 100]),
        savedIncome(4_567.89, "monthly", "employment", [400, 110]),
        savedIncome(5_678.9, "three_months", "employment", [500, 120]),
      ],
      investments: 9_876.54,
      investments_relevant: true,
      legal_aid_payments_conditional_value: 0,
      legal_aid_payments_frequency: "total",
      legal_aid_payments_relevant: true,
      property_owned: "none",
      receives_benefits: true,
      valuables: 500.01,
      valuables_relevant: true,
    }),
  [MeansAssessmentScenarioName.HousingMortgage]: () =>
    createMeansAssessment({
      house_value: 275_000,
      housing_loan_payments: 950,
      housing_payments_loan_frequency: "monthly",
      mortgage: 145_000,
      percentage_owned: 75,
      property_owned: "with_mortgage",
    }),

  [MeansAssessmentScenarioName.HousingSharedOwnership]: () =>
    createMeansAssessment({
      combined_frequency: "monthly",
      house_value: 190_000,
      housing_benefit_frequency: "monthly",
      housing_benefit_relevant: true,
      housing_benefit_value: 90,
      mortgage: 32_000,
      percentage_owned: 40,
      property_landlord: false,
      property_owned: "shared_ownership",
      rent: 480,
      shared_ownership_mortgage: 320,
    }),

  [MeansAssessmentScenarioName.MissingEligibility]: () => ({
    eligibility: null,
    meansAssessmentRequired: true,
  }),

  [MeansAssessmentScenarioName.OtherIncomeAndOutgoings]: () =>
    createMeansAssessment({
      ...partnerAnswers(),
      child_dependants: true,
      child_dependants_count: 1,
      childcare_payments_conditional_value: 180,
      childcare_payments_frequency: "monthly",
      childcare_payments_relevant: true,
      dependants_get_income: false,
      employment_status: "in_work",
      friends_or_family_conditional_value: 40,
      friends_or_family_frequency: "monthly",
      friends_or_family_relevant: true,
      incomes: [savedIncome(2_000, "monthly", "employment", [150, 100])],
      legal_aid_payments_conditional_value: 20,
      legal_aid_payments_frequency: "every_four_weeks",
      legal_aid_payments_relevant: true,
      maintenance_conditional_value: 110,
      maintenance_frequency: "every_week",
      maintenance_payments_conditional_value: 50,
      maintenance_payments_frequency: "monthly",
      maintenance_payments_relevant: true,
      maintenance_relevant: true,
      other_conditional_value: 35,
      other_relevant: true,
      partner_childcare_payments_conditional_value: 75,
      partner_childcare_payments_frequency: "every_two_weeks",
      partner_childcare_payments_relevant: true,
      partner_employment_status: "in_work",
      partner_friends_or_family_conditional_value: 60,
      partner_friends_or_family_frequency: "every_four_weeks",
      partner_friends_or_family_relevant: true,
      partner_incomes: [savedIncome(1_500, "monthly", "employment", [100, 75])],
      partner_legal_aid_payments_conditional_value: 15,
      partner_legal_aid_payments_frequency: "monthly",
      partner_legal_aid_payments_relevant: true,
      partner_maintenance_conditional_value: 90,
      partner_maintenance_frequency: "total",
      partner_maintenance_payments_conditional_value: 30,
      partner_maintenance_payments_frequency: "every_week",
      partner_maintenance_payments_relevant: true,
      partner_maintenance_relevant: true,
      partner_other_conditional_value: 25,
      partner_other_relevant: true,
      partner_pension_conditional_value: 80,
      partner_pension_frequency: "monthly",
      partner_pension_relevant: true,
      partner_property_or_lodger_conditional_value: 200,
      partner_property_or_lodger_frequency: "every_two_weeks",
      partner_property_or_lodger_relevant: true,
      partner_student_finance_conditional_value: 120,
      partner_student_finance_relevant: true,
      pension_conditional_value: 100,
      pension_frequency: "every_four_weeks",
      pension_relevant: true,
      property_or_lodger_conditional_value: 250,
      property_or_lodger_frequency: "monthly",
      property_or_lodger_relevant: true,
      student_finance_conditional_value: 90,
      student_finance_relevant: true,
    }),

  [MeansAssessmentScenarioName.Passporting]: () =>
    createMeansAssessment({ passporting: true }, exemptResult()),

  [MeansAssessmentScenarioName.PropertiesAndAssets]: () =>
    createMeansAssessment({
      ...partnerAnswers(),
      additional_properties: [
        savedProperty(125_000, 50, { disputed: true, mortgage: 65_000 }),
        savedProperty(80_000, 25, {
          disputed: false,
          inlineMortgage: true,
          mortgage: 25_000,
        }),
      ],
      additional_property_owned: "with_mortgage",
      bank_accounts: [
        { account_in_dispute: false, amount: 1_250.5 },
        { account_in_dispute: true, amount: 300 },
      ],
      house_value: 200_000,
      investments: 4_500,
      investments_in_dispute: true,
      investments_relevant: true,
      partner_additional_properties: [
        savedProperty(60_000, 50, { disputed: false, mortgage: 12_000 }),
      ],
      partner_additional_property_owned: "with_mortgage",
      partner_bank_accounts: [{ account_in_dispute: false, amount: 700 }],
      partner_investments: 1_800,
      partner_investments_relevant: true,
      partner_valuables: 950,
      partner_valuables_relevant: true,
      percentage_owned: 100,
      property_owned: "outright",
      valuables: 2_250,
      valuables_in_dispute: true,
      valuables_relevant: true,
    }),

  [MeansAssessmentScenarioName.StaleInactiveAnswers]: () =>
    createMeansAssessment({
      additional_properties: [savedProperty(90_000, 100)],
      additional_property_owned: "none",
      benefits: [savedBenefit("Stale client benefit", 80, "monthly")],
      childcare_payments_conditional_value: 55,
      childcare_payments_frequency: "monthly",
      childcare_payments_relevant: false,
      employment_status: "unemployed",
      friends_or_family_conditional_value: 75,
      friends_or_family_frequency: "monthly",
      friends_or_family_relevant: false,
      house_value: 150_000,
      incomes: [savedIncome(900, "monthly", "employment")],
      investments: 1_000,
      investments_in_dispute: true,
      investments_relevant: false,
      maintenance_payments_conditional_value: 35,
      maintenance_payments_frequency: "monthly",
      maintenance_payments_relevant: false,
      partner: false,
      partner_additional_properties: [savedProperty(45_000, 50)],
      partner_additional_property_owned: "outright",
      partner_bank_accounts: [{ amount: 500 }],
      partner_benefits: [savedBenefit("Stale benefit", 30, "monthly")],
      partner_employment_status: "in_work",
      partner_incomes: [savedIncome(1_000, "monthly", "employment")],
      partner_receives_benefits: true,
      property_owned: "none",
      valuables: 800,
      valuables_in_dispute: true,
      valuables_relevant: false,
    }),

  [MeansAssessmentScenarioName.UnavailableResult]: () =>
    createMeansAssessment({}, null),

  [MeansAssessmentScenarioName.Under18ControlledClr]: () =>
    createMeansAssessment(
      {
        client_age: "under_18",
        controlled_legal_representation: true,
        level_of_help: "controlled",
      },
      exemptResult(),
    ),

  [MeansAssessmentScenarioName.Under18NoMeans]: () =>
    createMeansAssessment(
      {
        aggregated_means: false,
        client_age: "under_18",
        regular_income: false,
        under_eighteen_assets: false,
      },
      exemptResult(),
    ),

  [MeansAssessmentScenarioName.UnsupportedMeansAssessment]: () =>
    createMeansAssessment({}, savedResult(), false),
};
