import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffects } from "#/journeys/effects.js";
import { doYouHaveEvidence } from "#/journeys/evidence/steps/do-you-have-evidence.step.js";

const journeyCode = "evidence";

export const EvidenceJourney = journey({
  code: "evidence",
  onAccess: [
    access({
      effects: [JourneyEffects.LoadDraftAnswers(journeyCode)],
    }),
  ],
  path: "/cases/evidence",
  reachability: { disableReachabilityChecks: false },
  steps: [doYouHaveEvidence(journeyCode)],
  title: "Record new case",
  view: { template: "partials/form-step" },
});
