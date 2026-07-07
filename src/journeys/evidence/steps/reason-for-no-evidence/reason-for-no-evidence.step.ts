import {
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffects } from "#/journeys/effects.js";
import {
  backLink,
  caption,
  continueButton,
} from "#/journeys/evidence/common.blocks.js";
import {
  moreDetailsForNoEvidence,
  reasonForNoEvidenceRadioInput,
} from "#/journeys/evidence/steps/reason-for-no-evidence/reason-for-no-evidence.blocks.js";
import { t } from "#/lib/i18n.js";

export const reasonForNoEvidence = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink("/cases/evidence/do-you-have-evidence"),
      caption,
      reasonForNoEvidenceRadioInput,
      moreDetailsForNoEvidence,
      continueButton,
    ],
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
    path: "/reason-for-no-evidence",
    reachability: { entryWhen: true },
    title: t("journeys.evidence.reasonForNoEvidence.title"),
  });
