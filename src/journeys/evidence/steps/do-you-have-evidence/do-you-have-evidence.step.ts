import {
  Answer,
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { EvidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  backLink,
  caption,
  continueButton,
} from "#/journeys/evidence/common.blocks.js";
import { doYouHaveEvidenceRadioInput } from "#/journeys/evidence/steps/do-you-have-evidence/do-you-have-evidence.blocks.js";
import { t } from "#/lib/i18n.js";

export const doYouHaveEvidence = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink("/cases/new/task-list"),
      caption,
      doYouHaveEvidenceRadioInput,
      continueButton,
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [EvidenceEffects.saveDraftAnswers(journeyCode)],
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
