import {
  access,
  journey,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffects } from "#/journeys/effects.js";
import { ecfStep } from "./steps/1-ecf.step.js";
import { ineligibleStep } from "./steps/1-ecf-dropout.step.js";

const journeyCode = "createApplication";

export const createApplicationJourney = journey({
  code: "createApplication",
  onAccess: [
    access({
      effects: [JourneyEffects.LoadDraftAnswers(journeyCode)],
    }),
  ],
  path: "/create-application",
  reachability: { disableReachabilityChecks: false },
  steps: [ecfStep(journeyCode), ineligibleStep(journeyCode)],
  title: "Record new case",
  view: { template: "partials/form-step" },
});
