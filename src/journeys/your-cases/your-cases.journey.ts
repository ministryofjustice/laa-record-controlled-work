import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { yourCasesIneligibleStep } from "#/journeys/your-cases/steps/your-cases-ineligible/your-cases-ineligible.step.js";
import { yourCasesRecordedStep } from "#/journeys/your-cases/steps/your-cases-recorded/your-cases-recorded.step.js";
import { yourCasesStep } from "#/journeys/your-cases/steps/your-cases/your-cases.step.js";

export const yourCasesJourney = journey({
  code: "yourCases",
  path: "/",
  reachability: { disableReachabilityChecks: true },
  steps: [yourCasesStep(), yourCasesRecordedStep(), yourCasesIneligibleStep()],
  title: "Your Cases",
  view: { template: "partials/case-list-step" },
});
