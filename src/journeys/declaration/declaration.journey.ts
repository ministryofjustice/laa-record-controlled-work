import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

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
  path: "/cases/:applicationId/declaration",
  reachability: { disableReachabilityChecks: true },
  steps: [confirmStep(), signStep()],
  title: "Declaration",
  view: { template: "partials/form-step" },
});
