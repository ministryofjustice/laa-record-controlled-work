/* eslint-disable @typescript-eslint/no-magic-numbers -- synthetic saved payload values */
/* eslint-disable jsdoc/require-jsdoc -- named fixture scenarios are self-describing */
import type { MeansAssessmentScenario } from "#tests/fixtures/meansAssessment/builders.js";

import { createMeansAssessment } from "#tests/fixtures/meansAssessment/builders.js";

interface IncomeCalculationOptions {
  malformedIncome?: boolean;
  partner?: boolean;
  uncalculated?: boolean;
}

export function createIncomeCalculationScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
    { employment_status: "unemployed" },
    createIncomeCalculationResult(),
  );
}

export function createPartnerIncomeCalculationScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
    { partner: false },
    createIncomeCalculationResult({ partner: true }),
  );
}

export function createUnavailableIncomeCalculationScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
    {},
    createIncomeCalculationResult({ malformedIncome: true }),
  );
}

export function createUncalculatedIncomeScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
    {},
    createIncomeCalculationResult({ uncalculated: true }),
  );
}

function createIncomeCalculationResult({
  malformedIncome = false,
  partner = false,
  uncalculated = false,
}: IncomeCalculationOptions = {}): Record<string, unknown> {
  const assessment: Record<string, unknown> = {
    gross_income: malformedIncome ? {} : createIncomeSources(),
  };
  const resultSummary: Record<string, unknown> = {
    disposable_income: {
      combined_total_disposable_income: 42,
      employment_income: { gross_income: 1_000.5 },
      proceeding_types: [{ result: "eligible", upper_threshold: 733 }],
    },
    gross_income: {
      combined_total_gross_income: 102.03,
      proceeding_types: [
        {
          result: uncalculated ? "not_calculated" : "eligible",
          upper_threshold: 2_500,
        },
        {
          result: uncalculated ? "not_calculated" : "eligible",
          upper_threshold: 2_000,
        },
      ],
    },
    overall_result: { result: "eligible" },
  };

  if (partner) {
    assessment.partner_capital = { capital_items: {} };
    assessment.partner_gross_income = createIncomeSources();
    resultSummary.partner_disposable_income = {
      employment_income: { gross_income: 350.25 },
    };
  }

  return { assessment, result_summary: resultSummary };
}

function createIncomeSources(): Record<string, unknown> {
  return {
    irregular_income: {
      monthly_equivalents: { student_loan: 0.01, unspecified_source: null },
    },
    other_income: {
      monthly_equivalents: {
        all_sources: {
          friends_or_family: 1.23,
          maintenance_in: null,
          pension: 0,
          property_or_lodger: 55.55,
        },
      },
    },
    state_benefits: { monthly_equivalents: { all_sources: 0 } },
  };
}
