import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffects } from "#/journeys/effects.js";
import { checkAnswersStep } from "#/journeys/evidence/steps/check-answers/check-answers.step.js";
import { doYouHaveEvidence } from "#/journeys/evidence/steps/do-you-have-evidence/do-you-have-evidence.step.js";
import { evidenceOfExpenditure } from "#/journeys/evidence/steps/evidence-of-expenditure/evidence-of-expenditure.step.js";
import { evidenceOfIncome } from "#/journeys/evidence/steps/evidence-of-income/evidence-of-income.step.js";
import { reasonForNoEvidence } from "#/journeys/evidence/steps/reason-for-no-evidence/reason-for-no-evidence.step.js";
import { evidenceOfCapital } from "#/journeys/evidence/steps/evidence-of-capital/evidence-of-capital.step.js";

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
  steps: [
    doYouHaveEvidence(journeyCode),
    reasonForNoEvidence(journeyCode),
    evidenceOfIncome(journeyCode),
    evidenceOfExpenditure(journeyCode),
    evidenceOfCapital(journeyCode),
    checkAnswersStep(),
  ],
  title: "Evidence",
  view: { template: "partials/form-step" },
});
