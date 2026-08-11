import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";
import { clientConfirmationStep } from "#/journeys/declaration/steps/confirmation/client-confirmation.step.js";

import { JourneyEffects } from "#/journeys/effects.js";

const journeyCode = "declaration";

export const DeclarationJourney = journey({
  code: "declaration",
  onAccess: [
    access({
      effects: [JourneyEffects.LoadDraftAnswers(journeyCode)],
    }),
  ],
  path: "/cases/new/declaration",
  reachability: { disableReachabilityChecks: false },
  steps: [
    clientConfirmationStep(),
  ],
  title: "Declaration",
  view: { template: "partials/form-step" },
});
