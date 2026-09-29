import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";

import { declarationEffects } from "./declaration.effects.js";
import { checkAnswersStep } from "./steps/checkAnswers/checkAnswers.step.js";
import { confirmStep } from "./steps/confirmation/confirmation.step.js";
import { signStep } from "./steps/sign/sign.step.js";
import { ufnStep } from "./steps/ufn/ufn.step.js";

const journeyCode = "declaration";

export const DeclarationJourney = journey({
  code: "declaration",
  onAccess: [
    access({
      effects: [declarationEffects.loadDraftAnswers(journeyCode)],
    }),
  ],
  path: `/cases/:${PARAMS_KEYS.applicationID}/declaration`,
  reachability: { disableReachabilityChecks: false },
  steps: [confirmStep(), signStep(), ufnStep(), checkAnswersStep()],
  title: "Declaration",
  view: { template: "partials/form-step" },
});
