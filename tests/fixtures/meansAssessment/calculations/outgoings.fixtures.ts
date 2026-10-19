/* eslint-disable @typescript-eslint/no-magic-numbers -- synthetic saved result values */
/* eslint-disable jsdoc/require-jsdoc -- named fixture scenarios are self-describing */
import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { MeansAssessmentScenario } from "#tests/fixtures/meansAssessment/builders.js";

import {
  createIncome,
  createMeansAssessment,
  createPartnerAnswers,
} from "#tests/fixtures/meansAssessment/builders.js";

interface OutgoingsCalculationOptions {
  malformed?: boolean;
  partner?: boolean;
  uncalculated?: boolean;
}

export function createOutgoingsCalculationScenario(): MeansAssessmentScenario {
  return createOutgoingsScenario();
}

export function createPartnerOutgoingsCalculationScenario(): MeansAssessmentScenario {
  return createOutgoingsScenario({ partner: true });
}

export function createUnavailableOutgoingsCalculationScenario(): MeansAssessmentScenario {
  return createOutgoingsScenario({ malformed: true });
}

export function createUncalculatedOutgoingsScenario(): MeansAssessmentScenario {
  return createOutgoingsScenario({ uncalculated: true });
}

function createOutgoingDetails(childCare: number): Record<string, unknown> {
  return {
    monthly_equivalents: {
      all_sources: {
        child_care: childCare,
        legal_aid: 0,
        maintenance_out: 50.25,
      },
    },
  };
}

function createOutgoingsAnswers(partner: boolean): Partial<EligibilityData> {
  return {
    ...(partner ? createPartnerAnswers() : {}),
    child_dependants: true,
    child_dependants_count: 1,
    employment_status: "in_work",
    incomes: [
      createIncome(2_000, "monthly", "employment"),
      createIncome(100, "monthly", "statutory_pay"),
    ],
    partner: false,
    property_owned: "shared_ownership",
  };
}

function createOutgoingsResult({
  malformed,
  partner,
  uncalculated,
}: OutgoingsCalculationOptions): Record<string, unknown> {
  return {
    assessment: {
      disposable_income: malformed
        ? { monthly_equivalents: { all_sources: { legal_aid: "invalid" } } }
        : createOutgoingDetails(12.34),
      ...(partner
        ? {
            partner_capital: { capital_items: {} },
            partner_disposable_income: createOutgoingDetails(6.78),
          }
        : {}),
    },
    result_summary: {
      disposable_income: {
        allowed_housing_costs: 545,
        combined_total_disposable_income: 455.67,
        combined_total_outgoings_and_allowances: 700.01,
        dependant_allowance: 123.45,
        employment_income: {
          fixed_employment_deduction: 10.01,
          gross_income: 2_000,
          national_insurance: 2.01,
          tax: 15.2,
        },
        net_housing_costs: 300.08,
        partner_allowance: 75,
        proceeding_types: [
          {
            result: uncalculated ? "not_calculated" : "eligible",
            upper_threshold: 733,
          },
          {
            result: uncalculated ? "not_calculated" : "eligible",
            upper_threshold: 650,
          },
        ],
      },
      ...(partner
        ? {
            partner_disposable_income: {
              employment_income: {
                fixed_employment_deduction: 3,
                gross_income: 1_000,
                national_insurance: 1.5,
                tax: 4.25,
              },
              partner_allowance: 0,
            },
          }
        : {}),
      ...(uncalculated
        ? {
            gross_income: {
              combined_total_gross_income: 2_000,
              proceeding_types: [
                { result: "eligible", upper_threshold: 2_657 },
              ],
            },
          }
        : {}),
      overall_result: { result: "eligible" },
    },
  };
}

function createOutgoingsScenario({
  malformed = false,
  partner = false,
  uncalculated = false,
}: OutgoingsCalculationOptions = {}): MeansAssessmentScenario {
  return createMeansAssessment(
    createOutgoingsAnswers(partner),
    createOutgoingsResult({ malformed, partner, uncalculated }),
  );
}
