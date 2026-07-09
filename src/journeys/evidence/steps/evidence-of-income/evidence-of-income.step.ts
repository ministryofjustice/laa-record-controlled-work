import {
  Answer,
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffects } from "#/journeys/effects.js";
import {
evidenceOfIncomeTypes,
} from "#/journeys/evidence/steps/evidence-of-income/evidence-of-income.blocks.js";
import { t } from "#/lib/i18n.js";
import { caption, continueButton, govBackLink } from "#/journeys/evidence/steps/do-you-have-evidence/do-you-have-evidence.blocks.js";

export const evidenceOfIncome = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [govBackLink, caption, evidenceOfIncomeTypes, continueButton],
    onSubmission: [
      submit({
        onValid: {
          effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({ goto: "evidence-of-expenditure-and-capital" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/evidence-of-income",
    reachability: { entryWhen: true },
    title: t("journeys.evidence.evidenceOfIncome.title"),
  });
