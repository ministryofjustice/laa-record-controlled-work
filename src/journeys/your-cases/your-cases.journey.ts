import {
  access,
  Condition,
  createForgePackage,
  Data,
  journey,
  redirect,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { YourCasesEffectsDeps } from "#/journeys/your-cases/your-cases.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { yourCasesIneligibleStep } from "#/journeys/your-cases/steps/your-cases-ineligible/your-cases-ineligible.step.js";
import { yourCasesRecordedStep } from "#/journeys/your-cases/steps/your-cases-recorded/your-cases-recorded.step.js";
import { yourCasesStep } from "#/journeys/your-cases/steps/your-cases/your-cases.step.js";
import {
  yourCasesEffects,
  yourCasesEffectsRegistry,
} from "#/journeys/your-cases/your-cases.effects.js";

const yourCasesJourney = journey({
  code: "cases",
  onAccess: [
    access({
      effects: [yourCasesEffects.loadSelectedOffice()],
      next: [
        redirect({
          goto: "/select-office",
          when: Data(CONTEXT_DATA_KEYS.selectedOffice).not.match(
            Condition.IsRequired(),
          ),
        }),
      ],
    }),
  ],
  path: "/",
  reachability: { disableReachabilityChecks: true },
  steps: [yourCasesStep, yourCasesRecordedStep, yourCasesIneligibleStep],
  title: "Your Cases",
  view: { template: "partials/case-list-step" },
});

export const yourCasesPackage = createForgePackage<YourCasesEffectsDeps>({
  functions: [yourCasesEffectsRegistry],
  journey: yourCasesJourney,
});
