/* eslint-disable @typescript-eslint/no-magic-numbers -- synthetic saved result values */
/* eslint-disable jsdoc/require-jsdoc -- named fixture scenarios are self-describing */
import type { MeansAssessmentScenario } from "#tests/fixtures/meansAssessment/builders.js";

import {
  createMeansAssessment,
  createPartnerAnswers,
} from "#tests/fixtures/meansAssessment/builders.js";

interface CapitalCalculationOptions {
  malformedProperties?: boolean;
  uncalculated?: boolean;
}

export function createCapitalPropertiesScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
    {
      combined_frequency: "monthly",
      ...createPartnerAnswers(),
      house_value: 190_000,
      housing_benefit_frequency: "monthly",
      housing_benefit_relevant: true,
      housing_benefit_value: 90,
      mortgage: 32_000,
      partner: false,
      percentage_owned: 40,
      property_landlord: true,
      property_owned: "shared_ownership",
      rent: 480,
      shared_ownership_mortgage: 320,
    },
    createCapitalResult(),
  );
}

export function createUnavailableCapitalPropertiesScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
    { client_age: "standard" },
    createCapitalResult({ malformedProperties: true }),
  );
}

export function createUncalculatedCapitalScenario(): MeansAssessmentScenario {
  return createMeansAssessment({}, createCapitalResult({ uncalculated: true }));
}

function createCapitalResult({
  malformedProperties = false,
  uncalculated = false,
}: CapitalCalculationOptions = {}): Record<string, unknown> {
  const clientMainHome = createProperty({
    assessed_equity: 93_456.78,
    main_home_equity_disregard: 15_000,
    net_equity: 155_761.3,
    outstanding_mortgage: 100_000,
    percentage_owned: 63.6,
    smod_allowance: 500,
    transaction_allowance: 7_500,
    value: 300_000,
  });
  const clientAdditionalProperties = [
    createProperty({ assessed_equity: 45_000, value: 50_000 }),
    createProperty({
      assessed_equity: 12_345.67,
      net_equity: 35_000,
      percentage_owned: 49.6,
      value: 75_000,
    }),
  ];
  const partnerAdditionalProperty = createProperty({
    assessed_equity: 21_000,
    main_home_equity_disregard: 2_000,
    net_equity: 35_000,
    percentage_owned: 50,
    smod_allowance: 1_000,
    value: 70_000,
  });

  if (malformedProperties) {
    clientAdditionalProperties[0].percentage_owned = "invalid";
  }

  return {
    assessment: {
      capital: {
        capital_items: {
          properties: {
            additional_properties: clientAdditionalProperties,
            main_home: clientMainHome,
            vehicles: [{ value: "ignored controlled-work vehicle" }],
          },
        },
      },
      disposable_income: createOutgoingDetails(),
      gross_income: createIncomeDetails(),
      partner_capital: {
        capital_items: {
          properties: {
            additional_properties: [
              partnerAdditionalProperty,
              structuredClone(partnerAdditionalProperty),
            ],
          },
        },
      },
      partner_disposable_income: createOutgoingDetails(),
      partner_gross_income: createIncomeDetails(),
    },
    result_summary: {
      capital: {
        combined_assessed_capital: 126_802.45,
        disputed_non_property_disregard: 350,
        pensioner_disregard_applied: 500,
        proceeding_types: [
          {
            result: uncalculated ? "not_calculated" : "eligible",
            upper_threshold: 400_000,
          },
          {
            result: uncalculated ? "not_calculated" : "eligible",
            upper_threshold: 350_000,
          },
        ],
        subject_matter_of_dispute_disregard: 500,
        total_capital: 137_050.51,
        total_capital_with_smod: 136_700.5,
        total_liquid: 10_200.01,
        total_non_liquid: 150,
        total_property: 126_700.5,
      },
      disposable_income: {
        allowed_housing_costs: 0,
        combined_total_disposable_income: 800,
        combined_total_outgoings_and_allowances: 400,
        dependant_allowance: 0,
        employment_income: {
          fixed_employment_deduction: 0,
          gross_income: 1_200,
          national_insurance: 0,
          tax: 0,
        },
        net_housing_costs: 0,
        partner_allowance: 0,
        proceeding_types: [{ result: "eligible", upper_threshold: 733 }],
      },
      gross_income: {
        combined_total_gross_income: 1_200,
        proceeding_types: [{ result: "eligible", upper_threshold: 2_657 }],
      },
      overall_result: { result: "eligible" },
      partner_capital: {
        pensioner_disregard_applied: 250,
        total_capital_with_smod: 51_500,
        total_liquid: 1_000,
        total_non_liquid: 500,
        total_property: 50_000,
      },
      partner_disposable_income: {
        employment_income: {
          fixed_employment_deduction: 0,
          gross_income: 0,
          national_insurance: 0,
          tax: 0,
        },
        partner_allowance: 0,
      },
    },
  };
}

function createIncomeDetails(): Record<string, unknown> {
  return {
    irregular_income: {
      monthly_equivalents: { student_loan: 0, unspecified_source: 0 },
    },
    other_income: {
      monthly_equivalents: {
        all_sources: {
          friends_or_family: 0,
          maintenance_in: 0,
          pension: 0,
          property_or_lodger: 0,
        },
      },
    },
    state_benefits: { monthly_equivalents: { all_sources: 0 } },
  };
}

function createOutgoingDetails(): Record<string, unknown> {
  return {
    monthly_equivalents: {
      all_sources: { child_care: 0, legal_aid: 0, maintenance_out: 0 },
    },
  };
}

function createProperty(
  fields: Record<string, number>,
): Record<string, unknown> {
  return {
    assessed_equity: 0,
    main_home_equity_disregard: 0,
    net_equity: 0,
    outstanding_mortgage: 0,
    percentage_owned: 100,
    smod_allowance: 0,
    transaction_allowance: 0,
    value: 0,
    ...fields,
  };
}
