/* eslint-disable @typescript-eslint/no-magic-numbers -- representative saved results */
/* eslint-disable jsdoc/require-jsdoc -- named fixture scenarios are self-describing */
import type { MeansAssessmentScenario } from "#tests/fixtures/meansAssessment/builders.js";

import { createMeansAssessment } from "#tests/fixtures/meansAssessment/builders.js";

export function createAsylumSupportScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
    { asylum_support: true, immigration_or_asylum: true },
    createExemptResult(),
  );
}

export function createCalculationStatesScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
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
  );
}

export function createMeansAssessmentNotRequiredScenario(): MeansAssessmentScenario {
  return { ...createMeansAssessment(), meansAssessmentRequired: false };
}

export function createMissingEligibilityScenario(): MeansAssessmentScenario {
  return { eligibility: null, meansAssessmentRequired: true };
}

export function createPassportingScenario(): MeansAssessmentScenario {
  return createMeansAssessment({ passporting: true }, createExemptResult());
}

export function createUnavailableResultScenario(): MeansAssessmentScenario {
  return createMeansAssessment({}, null);
}

export function createUnder18ControlledClrScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
    {
      client_age: "under_18",
      controlled_legal_representation: true,
      level_of_help: "controlled",
    },
    createExemptResult(),
  );
}

export function createUnder18NoMeansScenario(): MeansAssessmentScenario {
  return createMeansAssessment(
    {
      aggregated_means: false,
      client_age: "under_18",
      regular_income: false,
      under_eighteen_assets: false,
    },
    createExemptResult(),
  );
}

function createExemptResult(): Record<string, unknown> {
  return { result_summary: { overall_result: { result: "eligible" } } };
}
