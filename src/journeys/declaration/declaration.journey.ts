import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { PARAMS_KEYS } from "#/journeys/journey.constants.js";

import { declarationEffects } from "./declaration.effects.js";
import { confirmStep } from "./steps/confirmation/confirmation.step.js";
import { signStep } from "./steps/sign/sign.step.js";

const journeyCode = "declaration";

export const DeclarationJourney = journey({
  code: "declaration",
  onAccess: [
    access({
      effects: [declarationEffects.loadDraftAnswers(journeyCode)],
    }),
  ],
  path: `/cases/:${PARAMS_KEYS.applicationID}/declaration`,
  reachability: { disableReachabilityChecks: true },
  steps: [confirmStep(), signStep()],
  title: "Declaration",
  view: { template: "partials/form-step" },
});
