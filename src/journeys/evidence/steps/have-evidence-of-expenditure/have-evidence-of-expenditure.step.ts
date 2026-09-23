import {
  Answer,
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  description,
  haveEvidenceOfExpenditureRadioInput,
  link,
} from "#/journeys/evidence/steps/have-evidence-of-expenditure/have-evidence-of-expenditure.blocks.js";
import { caption, continueButton, heading } from "#/journeys/shared.blocks.js";
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
      submit({
        onValid: {
          effects: [evidenceEffects.saveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({
              goto: "evidence-of-expenditure",
              when: Answer("haveEvidenceOfExpenditure").match(
                Condition.Equals("yes"),
              ),
            }),
            redirect({ goto: "have-evidence-of-capital" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/have-evidence-of-expenditure",
    title: t("journeys.evidence.haveEvidenceOfExpenditure.title"),
  });
