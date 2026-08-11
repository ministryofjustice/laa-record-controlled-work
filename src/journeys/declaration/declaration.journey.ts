import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffects } from "#/journeys/effects.js";

import { confirmStep } from "./steps/confirmation/confirmation.step.js";
import { signStep } from "./steps/sign/sign.step.js";

const journeyCode = "declaration";

export const DeclarationJourney = journey({
  code: "declaration",
  onAccess: [
    access({
      effects: [JourneyEffects.LoadDraftAnswers(journeyCode)],
    }),
  ],
  path: "/cases/:applicationID/declaration",
  reachability: { disableReachabilityChecks: false },
  steps: [confirmStep(), signStep()],
  title: "Declaration",
  view: { template: "partials/form-step" },
});
