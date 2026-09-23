import {
  Answer,
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import { caption, continueButton, heading } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";
import { description, haveEvidenceOfCapitalRadioInput } from "#/journeys/evidence/steps/have-evidence-of-captial/have-evidence-of-capital.blocks.js";

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
              goto: "evidence-of-capital",
              when: Answer("haveEvidenceOfCapital").match(Condition.Equals("yes")),
            }),
            redirect({ goto: "have-evidence-of-capital" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/have-evidence-of-capital",
    title: t("journeys.evidence.haveEvidenceOfCapital.title"),
  });
