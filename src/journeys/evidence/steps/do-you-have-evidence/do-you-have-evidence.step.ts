import {
  Answer,
  Condition,
  Query,
  redirect,
  step,
  submit,
  SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import { doYouHaveEvidenceRadioInput } from "#/journeys/evidence/steps/do-you-have-evidence/do-you-have-evidence.blocks.js";
import { caption, continueButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";

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
      submit({
        onValid: {
          effects: [evidenceEffects.saveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({
              goto: "evidence-of-income",
              when: Answer("doYouHaveEvidence").match(Condition.Equals("yes")),
            }),
            redirect({ goto: "reason-for-no-evidence" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/have-evidence",
    reachability: { entryWhen: true },
    title: t("journeys.evidence.doYouHaveEvidence.title"),
  });

  const saveNoAndClearEvidence = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [
        evidenceEffects.clearFieldAnswers(journeyCode, [
          ...Object.values(EvidenceAnswers),
        ]),
        evidenceEffects.saveDraftAnswers(journeyCode)
      ],
      next: [redirectToCheckAnswers, redirectToHaveEvidenceOfCapital],
    },
    validate: true,
    when: Answer("haveEvidenceOfExpenditure").match(Condition.Equals("no")),
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
    when: Answer("haveEvidenceOfExpenditure").match(Condition.Equals("yes")),
  });