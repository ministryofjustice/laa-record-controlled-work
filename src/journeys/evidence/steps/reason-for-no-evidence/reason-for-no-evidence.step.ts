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
import { moreDetailsForNoEvidence, reasonForNoEvidenceRadioInput } from "#/journeys/evidence/steps/reason-for-no-evidence/reason-for-no-evidence.blocks.js";
import { backLink, caption, continueButton } from "#/journeys/evidence/common.blocks.js";

export const doYouHaveEvidence = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [backLink("/cases/evidence/do-you-have-evidence"), caption, reasonForNoEvidenceRadioInput, moreDetailsForNoEvidence, continueButton],
    onSubmission: [
      submit({
        onValid: {
          effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({ goto: "check-your-answers" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/have-evidence",
    reachability: { entryWhen: true },
    title: t("journeys.evidence.doYouHaveEvidence.title"),
  });
