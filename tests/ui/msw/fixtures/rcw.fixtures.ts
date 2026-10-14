import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";

import {
  MeansAssessmentScenarioName,
  meansAssessmentScenarios,
} from "#tests/fixtures/meansAssessment.fixtures.js";
export {
  applications,
  clientDetailsApplication,
  completeApplication,
  createApplicationResponse,
  incompleteApplication,
} from "#msw/fixtures/rcw.js";
import { completeApplication as baseCompleteApplication } from "#msw/fixtures/rcw.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const MEANS_ASSESSMENT_APPLICATION_IDS: Record<
  MeansAssessmentScenarioName,
  string
> = {
  [MeansAssessmentScenarioName.AsylumSupport]:
    "00000000-0000-4000-8000-000000000101",
  [MeansAssessmentScenarioName.Baseline]:
    "00000000-0000-4000-8000-000000000102",
  [MeansAssessmentScenarioName.CalculationStates]:
    "00000000-0000-4000-8000-000000000103",
  [MeansAssessmentScenarioName.EmployedHousehold]:
    "00000000-0000-4000-8000-000000000104",
  [MeansAssessmentScenarioName.FormattingVariants]:
    "00000000-0000-4000-8000-000000000105",
  [MeansAssessmentScenarioName.HousingMortgage]:
    "00000000-0000-4000-8000-000000000106",
  [MeansAssessmentScenarioName.HousingSharedOwnership]:
    "00000000-0000-4000-8000-000000000107",
  [MeansAssessmentScenarioName.MissingEligibility]:
    "00000000-0000-4000-8000-000000000108",
  [MeansAssessmentScenarioName.OtherIncomeAndOutgoings]:
    "00000000-0000-4000-8000-000000000109",
  [MeansAssessmentScenarioName.Passporting]:
    "00000000-0000-4000-8000-000000000110",
  [MeansAssessmentScenarioName.PropertiesAndAssets]:
    "00000000-0000-4000-8000-000000000111",
  [MeansAssessmentScenarioName.StaleInactiveAnswers]:
    "00000000-0000-4000-8000-000000000112",
  [MeansAssessmentScenarioName.UnavailableResult]:
    "00000000-0000-4000-8000-000000000115",
  [MeansAssessmentScenarioName.Under18ControlledClr]:
    "00000000-0000-4000-8000-000000000113",
  [MeansAssessmentScenarioName.Under18NoMeans]:
    "00000000-0000-4000-8000-000000000114",
  [MeansAssessmentScenarioName.UnsupportedMeansAssessment]:
    "00000000-0000-4000-8000-000000000116",
};

/**
 *
 * @param scenarioName
 */
/**
 * Creates a test application with one shared means-assessment scenario.
 * @param scenarioName The scenario supplying saved answers and results.
 * @returns A complete application response with a stable synthetic ID.
 */
function meansAssessmentApplication(
  scenarioName: MeansAssessmentScenarioName,
): Application {
  const scenario = meansAssessmentScenarios[scenarioName]();

  return getGetApplicationResponseMock({
    ...baseCompleteApplication,
    eligibility: scenario.eligibility,
    id: MEANS_ASSESSMENT_APPLICATION_IDS[scenarioName],
    meansAssessmentRequired: scenario.meansAssessmentRequired,
  });
}

export const meansAssessmentApplications = {
  [MeansAssessmentScenarioName.AsylumSupport]: meansAssessmentApplication(
    MeansAssessmentScenarioName.AsylumSupport,
  ),
  [MeansAssessmentScenarioName.Baseline]: meansAssessmentApplication(
    MeansAssessmentScenarioName.Baseline,
  ),
  [MeansAssessmentScenarioName.CalculationStates]: meansAssessmentApplication(
    MeansAssessmentScenarioName.CalculationStates,
  ),
  [MeansAssessmentScenarioName.EmployedHousehold]: meansAssessmentApplication(
    MeansAssessmentScenarioName.EmployedHousehold,
  ),
  [MeansAssessmentScenarioName.FormattingVariants]: meansAssessmentApplication(
    MeansAssessmentScenarioName.FormattingVariants,
  ),
  [MeansAssessmentScenarioName.HousingMortgage]: meansAssessmentApplication(
    MeansAssessmentScenarioName.HousingMortgage,
  ),
  [MeansAssessmentScenarioName.HousingSharedOwnership]:
    meansAssessmentApplication(
      MeansAssessmentScenarioName.HousingSharedOwnership,
    ),
  [MeansAssessmentScenarioName.MissingEligibility]: meansAssessmentApplication(
    MeansAssessmentScenarioName.MissingEligibility,
  ),
  [MeansAssessmentScenarioName.OtherIncomeAndOutgoings]:
    meansAssessmentApplication(
      MeansAssessmentScenarioName.OtherIncomeAndOutgoings,
    ),
  [MeansAssessmentScenarioName.Passporting]: meansAssessmentApplication(
    MeansAssessmentScenarioName.Passporting,
  ),
  [MeansAssessmentScenarioName.PropertiesAndAssets]: meansAssessmentApplication(
    MeansAssessmentScenarioName.PropertiesAndAssets,
  ),
  [MeansAssessmentScenarioName.StaleInactiveAnswers]:
    meansAssessmentApplication(
      MeansAssessmentScenarioName.StaleInactiveAnswers,
    ),
  [MeansAssessmentScenarioName.UnavailableResult]: meansAssessmentApplication(
    MeansAssessmentScenarioName.UnavailableResult,
  ),
  [MeansAssessmentScenarioName.Under18ControlledClr]:
    meansAssessmentApplication(
      MeansAssessmentScenarioName.Under18ControlledClr,
    ),
  [MeansAssessmentScenarioName.Under18NoMeans]: meansAssessmentApplication(
    MeansAssessmentScenarioName.Under18NoMeans,
  ),
  [MeansAssessmentScenarioName.UnsupportedMeansAssessment]:
    meansAssessmentApplication(
      MeansAssessmentScenarioName.UnsupportedMeansAssessment,
    ),
};
