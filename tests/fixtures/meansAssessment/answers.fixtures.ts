/* eslint-disable @typescript-eslint/no-magic-numbers -- representative saved answers */
/* eslint-disable jsdoc/require-jsdoc -- named fixture scenarios are self-describing */
import type { MeansAssessmentScenario } from "#tests/fixtures/meansAssessment/builders.js";

import {
  createBenefit,
  createIncome,
  createMeansAssessment,
  createPartnerAnswers,
  createProperty,
} from "#tests/fixtures/meansAssessment/builders.js";

export function createEmployedHouseholdScenario(): MeansAssessmentScenario {
  return createMeansAssessment({
    ...createPartnerAnswers(),
    adult_dependants: true,
    adult_dependants_count: 1,
    benefits: [
      createBenefit("Child Benefit", 84.2, "monthly"),
      createBenefit("Disability benefit", 22, "every_four_weeks"),
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
      createIncome(2_450, "monthly", "employment", [300, 120]),
      createIncome(125.5, "monthly", "statutory_pay"),
    ],
    partner_benefits: [createBenefit("Carer benefit", 65, "every_two_weeks")],
    partner_employment_status: "in_work",
    partner_incomes: [
      createIncome(1_800, "every_four_weeks", "self_employment", [210, 80]),
    ],
    partner_over_60: true,
    partner_receives_benefits: true,
    receives_benefits: true,
  });
}

export function createFormattingVariantsScenario(): MeansAssessmentScenario {
  return createMeansAssessment({
    additional_properties: [
      createProperty(123_456.78, 37),
      createProperty(9_999.99, 100, { inlineMortgage: false }),
    ],
    additional_property_owned: "outright",
    bank_accounts: [{ amount: 1_234.56 }, { amount: 1_234.56 }],
    benefits: [
      createBenefit("Benefit A", 1_200.5, "every_week"),
      createBenefit("Benefit B", 80, "every_two_weeks"),
      createBenefit("Benefit C", 42, "every_four_weeks"),
      createBenefit("Benefit D", 20, "monthly"),
    ],
    employment_status: "in_work",
    friends_or_family_conditional_value: 1_234.56,
    friends_or_family_frequency: "monthly",
    friends_or_family_relevant: true,
    housing_benefit_frequency: "monthly",
    housing_benefit_relevant: true,
    housing_benefit_value: 320,
    housing_payments: 1_500.25,
    housing_payments_frequency: "every_four_weeks",
    incomes: [
      createIncome(1_234.56, "every_week", "employment", [100.25, 80.1]),
      createIncome(2_345.67, "every_two_weeks", "self_employment", [200, 90]),
      createIncome(3_456.78, "every_four_weeks", "statutory_pay", [300, 100]),
      createIncome(4_567.89, "monthly", "employment", [400, 110]),
      createIncome(5_678.9, "every_two_weeks", "employment", [500, 120]),
    ],
    investments: 9_876.54,
    investments_relevant: true,
    legal_aid_payments_conditional_value: 25,
    legal_aid_payments_frequency: "monthly",
    legal_aid_payments_relevant: true,
    property_owned: "none",
    receives_benefits: true,
    valuables: 500.01,
    valuables_relevant: true,
  });
}

export function createHousingMortgageScenario(): MeansAssessmentScenario {
  return createMeansAssessment({
    house_value: 275_000,
    housing_loan_payments: 950,
    housing_payments_loan_frequency: "monthly",
    mortgage: 145_000,
    percentage_owned: 75,
    property_owned: "with_mortgage",
  });
}

export function createHousingSharedOwnershipScenario(): MeansAssessmentScenario {
  return createMeansAssessment({
    combined_frequency: "monthly",
    house_value: 190_000,
    housing_benefit_frequency: "monthly",
    housing_benefit_relevant: true,
    housing_benefit_value: 90,
    mortgage: 32_000,
    percentage_owned: 40,
    property_landlord: true,
    property_owned: "shared_ownership",
    rent: 480,
    shared_ownership_mortgage: 320,
  });
}

export function createOtherIncomeAndOutgoingsScenario(): MeansAssessmentScenario {
  return createMeansAssessment({
    ...createPartnerAnswers(),
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
    incomes: [createIncome(2_000, "monthly", "employment", [150, 100])],
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
    partner_incomes: [createIncome(1_500, "monthly", "employment", [100, 75])],
    partner_legal_aid_payments_conditional_value: 15,
    partner_legal_aid_payments_frequency: "monthly",
    partner_legal_aid_payments_relevant: true,
    partner_maintenance_conditional_value: 90,
    partner_maintenance_frequency: "monthly",
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
  });
}

export function createPropertiesAndAssetsScenario(): MeansAssessmentScenario {
  return createMeansAssessment({
    ...createPartnerAnswers(),
    additional_properties: [
      createProperty(125_000, 50, { disputed: true, mortgage: 65_000 }),
      createProperty(80_000, 25, {
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
      createProperty(60_000, 50, { disputed: false, mortgage: 12_000 }),
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
  });
}

export function createStaleInactiveAnswersScenario(): MeansAssessmentScenario {
  return createMeansAssessment({
    additional_properties: [createProperty(90_000, 100)],
    additional_property_owned: "none",
    benefits: [createBenefit("Stale client benefit", 80, "monthly")],
    childcare_payments_conditional_value: 55,
    childcare_payments_frequency: "monthly",
    childcare_payments_relevant: false,
    employment_status: "unemployed",
    friends_or_family_conditional_value: 75,
    friends_or_family_frequency: "monthly",
    friends_or_family_relevant: false,
    house_value: 150_000,
    incomes: [createIncome(900, "monthly", "employment")],
    investments: 1_000,
    investments_in_dispute: true,
    investments_relevant: false,
    maintenance_payments_conditional_value: 35,
    maintenance_payments_frequency: "monthly",
    maintenance_payments_relevant: false,
    partner: false,
    partner_additional_properties: [createProperty(45_000, 50)],
    partner_additional_property_owned: "outright",
    partner_bank_accounts: [{ amount: 500 }],
    partner_benefits: [createBenefit("Stale benefit", 30, "monthly")],
    partner_employment_status: "in_work",
    partner_incomes: [createIncome(1_000, "monthly", "employment")],
    partner_receives_benefits: true,
    property_owned: "none",
    valuables: 800,
    valuables_in_dispute: true,
    valuables_relevant: false,
  });
}
