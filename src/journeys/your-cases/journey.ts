import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { yourCasesStep } from "#/journeys/your-cases/steps/your-cases/your-cases.step.js";
import { YourCasesEffects } from "#/journeys/your-cases/your-cases.effects.js";

export const yourCasesJourney = journey({
  code: "yourCases",
  onAccess: [
    access({
      effects: [YourCasesEffects.LoadYourCaseList()],
    }),
  ],
  path: "/your-cases",
  reachability: { disableReachabilityChecks: true },
  steps: [yourCasesStep()],
  title: "Your Cases",
  view: { template: "partials/case-list-step" },
});
