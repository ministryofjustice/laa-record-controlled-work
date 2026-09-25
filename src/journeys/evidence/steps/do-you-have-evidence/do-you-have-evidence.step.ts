import {
  Answer,
  Condition,
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  CapitalEvidence,
  EvidenceAnswers,
  ExpenditureEvidence,
  IncomeEvidence,
} from "#/journeys/evidence/evidence.answers.js";
import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import { doYouHaveEvidenceRadioInput } from "#/journeys/evidence/steps/do-you-have-evidence/do-you-have-evidence.blocks.js";
import { caption, continueButton } from "#/journeys/shared.blocks.js";
import { hasCheckAnswersInQuery } from "#/journeys/shared.hook.js";
import { t } from "#/lib/i18n.js";

export const doYouHaveEvidence = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    backlink: "../task-list/",
    blocks: [
      caption(t("journeys.evidence.caption")),
      doYouHaveEvidenceRadioInput,
      continueButton(),
    ],
    onSubmission: [
      saveNoAndClearEvidence(journeyCode),
      saveYes(journeyCode),
      submitInvalid(),
    ],
    path: "/have-evidence",
    reachability: { entryWhen: true },
    title: t("journeys.evidence.doYouHaveEvidence.title"),
  });

const submitInvalid = (): SubmitHook =>
  submit({
    onInvalid: {},
    validate: true,
  });

const saveNoAndClearEvidence = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [
        evidenceEffects.clearFieldAnswers(journeyCode, [
          ...IncomeEvidence,
          EvidenceAnswers.haveEvidenceOfExpenditure,
          ...ExpenditureEvidence,
          EvidenceAnswers.haveEvidenceOfCapital,
          ...CapitalEvidence,
        ]),
        evidenceEffects.saveDraftAnswers(journeyCode),
      ],
      next: [redirectToReasonForNoEvidence, redirectToCheckAnswers],
    },
    validate: true,
    when: Answer(EvidenceAnswers.doYouHaveEvidence).match(
      Condition.Equals("no"),
    ),
  });

const saveYes = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [
        evidenceEffects.clearFieldAnswers(journeyCode, [
          EvidenceAnswers.moreDetailsForNoEvidence,
          EvidenceAnswers.reasonForNoEvidence,
        ]),
        evidenceEffects.saveDraftAnswers(journeyCode),
      ],
      next: [
        redirectToEvidenceOfIncome,
        redirectToEvidenceOfIncomeWithCheckQuery,
      ],
    },
    validate: true,
    when: Answer(EvidenceAnswers.doYouHaveEvidence).match(
      Condition.Equals("yes"),
    ),
  });

const redirectToEvidenceOfIncome = redirect({ goto: "evidence-of-income" });

const redirectToEvidenceOfIncomeWithCheckQuery = redirect({
  goto: "evidence-of-income?returnTo=check-answers",
  when: hasCheckAnswersInQuery,
});

const redirectToReasonForNoEvidence = redirect({
  goto: "reason-for-no-evidence",
});

const redirectToCheckAnswers = redirect({
  goto: "check-answers",
  when: hasCheckAnswersInQuery,
});
