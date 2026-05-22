import {
  access,
  journey,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { PatternEffects } from "#/journeys/effects.js";
import { ecfStep } from "./steps/1-ecf.step.js";
import { ineligibleStep } from "./steps/1-ecf-dropout.step.js";

const patternCode = "createApplication";

export const createApplicationJourney = journey({
  code: "createApplication",
  onAccess: [
    access({
      effects: [PatternEffects.LoadDraftAnswers(patternCode)],
    }),
  ],
  path: "/create-application",
  reachability: { disableReachabilityChecks: false },
  steps: [ecfStep, ineligibleStep],
  title: "Record new case",
  view: { template: "partials/form-step" },
});
