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
} from "#/journeys/evidence/evidence.answers.js";
import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  description,
  haveEvidenceOfCapitalRadioInput,
} from "#/journeys/evidence/steps/have-evidence-of-captial/have-evidence-of-capital.blocks.js";
import { caption, continueButton, heading } from "#/journeys/shared.blocks.js";
import { hasCheckAnswersInQuery } from "#/journeys/shared.hook.js";
import { t } from "#/lib/i18n.js";

export const haveEvidenceOfCapital = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      caption(t("journeys.evidence.caption")),
      heading(t("journeys.evidence.haveEvidenceOfCapital.title")),
      description(),
      haveEvidenceOfCapitalRadioInput(),
      continueButton(),
    ],
    onSubmission: [saveNoAndClearEvidence(journeyCode), saveYes(journeyCode), submitInvalid()],
    path: "/have-evidence-of-capital",
    title: t("journeys.evidence.haveEvidenceOfCapital.title"),
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
        evidenceEffects.clearFieldAnswers(journeyCode, [...CapitalEvidence]),
        evidenceEffects.saveDraftAnswers(journeyCode),
      ],
      next: [redirectToCheckAnswers],
    },
    validate: true,
    when: Answer(EvidenceAnswers.haveEvidenceOfCapital).match(
      Condition.Equals("no"),
    ),
  });

const saveYes = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [evidenceEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToEvidenceOfCapitalWithCheckQuery,
        redirectToEvidenceOfCapital,
      ],
    },
    validate: true,
    when: Answer(EvidenceAnswers.haveEvidenceOfCapital).match(
      Condition.Equals("yes"),
    ),
  });

const redirectToCheckAnswers = redirect({
  goto: "check-answers",
});

const redirectToEvidenceOfCapital = redirect({
  goto: "evidence-of-capital",
});

const redirectToEvidenceOfCapitalWithCheckQuery = redirect({
  goto: "evidence-of-capital?returnTo=check-answers",
  when: hasCheckAnswersInQuery,
});
