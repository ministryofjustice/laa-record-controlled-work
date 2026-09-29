import {
  Answer,
  Condition,
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  EvidenceAnswers,
  ExpenditureEvidence,
} from "#/journeys/evidence/evidence.answers.js";
import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  description,
  haveEvidenceOfExpenditureRadioInput,
  link,
} from "#/journeys/evidence/steps/have-evidence-of-expenditure/have-evidence-of-expenditure.blocks.js";
import { caption, continueButton, heading } from "#/journeys/shared.blocks.js";
import { hasCheckAnswersInQuery } from "#/journeys/shared.hook.js";
import { t } from "#/lib/i18n.js";

export const haveEvidenceOfExpenditure = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      caption(t("journeys.evidence.caption")),
      heading(t("journeys.evidence.haveEvidenceOfExpenditure.title")),
      description(),
      link(),
      haveEvidenceOfExpenditureRadioInput(),
      continueButton(),
    ],
    onSubmission: [
      saveNoAndClearEvidence(journeyCode),
      saveYes(journeyCode),
      submitInvalid(),
    ],
    path: "/have-evidence-of-expenditure",
    title: t("journeys.evidence.haveEvidenceOfExpenditure.title"),
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
          ...ExpenditureEvidence,
        ]),
        evidenceEffects.saveDraftAnswers(journeyCode),
      ],
      next: [redirectToCheckAnswers, redirectToHaveEvidenceOfCapital],
    },
    validate: true,
    when: Answer(EvidenceAnswers.haveEvidenceOfExpenditure).match(
      Condition.Equals("no"),
    ),
  });

const saveYes = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [evidenceEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToEvidenceOfExpenditureWithCheckQuery,
        redirectToEvidenceOfExpenditure,
      ],
    },
    validate: true,
    when: Answer(EvidenceAnswers.haveEvidenceOfExpenditure).match(
      Condition.Equals("yes"),
    ),
  });

const redirectToCheckAnswers = redirect({
  goto: "check-answers",
  when: hasCheckAnswersInQuery,
});

const redirectToHaveEvidenceOfCapital = redirect({
  goto: "have-evidence-of-capital",
});

const redirectToEvidenceOfExpenditure = redirect({
  goto: "evidence-of-expenditure",
});

const redirectToEvidenceOfExpenditureWithCheckQuery = redirect({
  goto: "evidence-of-expenditure?returnTo=check-answers",
  when: hasCheckAnswersInQuery,
});
