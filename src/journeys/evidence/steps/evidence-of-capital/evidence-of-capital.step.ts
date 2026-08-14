import {
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  backLink,
  caption,
  continueButton,
} from "#/journeys/evidence/common.blocks.js";
import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  capitalEvidenceGroup,
  heading,
  label,
} from "#/journeys/evidence/steps/evidence-of-capital/evidence-of-capital.blocks.js";
import { t } from "#/lib/i18n.js";

export const evidenceOfCapital = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink("/cases/evidence/evidence-of-expenditure"),
      caption,
      heading,
      label,
      capitalEvidenceGroup,
      continueButton,
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
    path: "/evidence-of-capital",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.evidence.evidenceOfCapital.title"),
  });
