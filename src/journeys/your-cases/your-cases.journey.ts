import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { yourCasesStep } from "#/journeys/your-cases/steps/your-cases/your-cases.step.js";

export const yourCasesJourney = journey({
  code: "yourCases",
  path: "/cases",
  reachability: { disableReachabilityChecks: true },
  steps: [yourCasesStep()],
  title: "Your Cases",
  view: { template: "partials/case-list-step" },
});
