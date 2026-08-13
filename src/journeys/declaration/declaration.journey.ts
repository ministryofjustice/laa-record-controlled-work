import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { confirmStep } from "#/journeys/declaration/steps/confirmation/confirmation.step.js";
import { JourneyEffects } from "#/journeys/effects.js";

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
  steps: [confirmStep()],
  title: "Declaration",
  view: { template: "partials/form-step" },
});
