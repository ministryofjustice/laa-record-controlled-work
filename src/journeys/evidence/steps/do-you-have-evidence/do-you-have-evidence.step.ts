import {
  Answer,
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { t } from "i18next";

import { JourneyEffects } from "#/journeys/effects.js";
import {
  caption,
  continueButton,
  doYouHaveEvidenceRadioInput,
  govBackLink,
} from "#/journeys/evidence/steps/do-you-have-evidence/do-you-have-evidence.blocks.js";

export const doYouHaveEvidence = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [govBackLink, caption, doYouHaveEvidenceRadioInput, continueButton],
    onSubmission: [
      submit({
        onValid: {
          effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
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
