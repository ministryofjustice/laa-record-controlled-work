import {
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  moreDetailsForNoEvidence,
  reasonForNoEvidenceRadioInput,
} from "#/journeys/evidence/steps/reason-for-no-evidence/reason-for-no-evidence.blocks.js";
import { caption, continueButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

export const reasonForNoEvidence = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      caption(t("journeys.evidence.caption")),
      reasonForNoEvidenceRadioInput,
      moreDetailsForNoEvidence,
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
            redirect({ goto: "check-answers" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/reason-for-no-evidence",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.evidence.reasonForNoEvidence.title"),
  });
