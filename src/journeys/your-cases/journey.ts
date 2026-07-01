import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { CaseListEffects } from "#/journeys/your-cases/effects.js";

import { yourCasesStep } from "./steps/your-cases.step.js";

export const yourCasesJourney = journey({
  code: "yourCases",
  onAccess: [
    access({
      effects: [CaseListEffects.LoadCaseList()],
    }),
  ],
  path: "/your-cases",
  reachability: { disableReachabilityChecks: true },
  steps: [yourCasesStep()],
  title: "Your Cases",
  view: { template: "partials/case-list-step" },
});
