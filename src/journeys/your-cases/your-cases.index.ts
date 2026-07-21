import {
  createForgePackage,
  journey,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { YourCasesEffectsDeps } from "#/journeys/your-cases/your-cases.types.js";

import { yourCasesIneligibleStep } from "#/journeys/your-cases/steps/your-cases-ineligible/your-cases-ineligible.step.js";
import { yourCasesRecordedStep } from "#/journeys/your-cases/steps/your-cases-recorded/your-cases-recorded.step.js";
import { yourCasesStep } from "#/journeys/your-cases/steps/your-cases/your-cases.step.js";
import { yourCasesEffectsRegistry } from "#/journeys/your-cases/your-cases.effects.js";

const yourCasesJourney = journey({
  code: "cases",
  path: "/",
  reachability: { disableReachabilityChecks: true },
  steps: [yourCasesStep, yourCasesRecordedStep, yourCasesIneligibleStep],
  title: "Your Cases",
  view: { template: "partials/case-list-step" },
});

export default createForgePackage<YourCasesEffectsDeps>({
  functions: [yourCasesEffectsRegistry],
  journey: yourCasesJourney,
});
