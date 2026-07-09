import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffects } from "#/journeys/effects.js";
import { doYouHaveEvidence } from "#/journeys/evidence/steps/do-you-have-evidence/do-you-have-evidence.step.js";
import { reasonForNoEvidence } from "#/journeys/evidence/steps/reason-for-no-evidence/reason-for-no-evidence.step.js";
import { evidenceOfIncome } from "#/journeys/evidence/steps/evidence-of-income/evidence-of-income.step.js";

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
  steps: [doYouHaveEvidence(journeyCode), reasonForNoEvidence(journeyCode), evidenceOfIncome(journeyCode)],
  title: "Evidence",
  view: { template: "partials/form-step" },
});