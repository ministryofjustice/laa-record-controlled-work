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
heading,
  employedEvidenceGroup,
  selfEmployedEvidenceGroup,
  benefitsInKindEvidenceGroup,
  otherEvidenceGroup,
  stateBenefitsEvidenceGroup,
  asylumSupportEvidenceGroup,
  taxCreditsEvidenceGroup,
} from "#/journeys/evidence/steps/evidence-of-income/evidence-of-income.blocks.js";
import { t } from "#/lib/i18n.js";
import { caption, continueButton, backLink } from "#/journeys/evidence/common.blocks.js";

export const evidenceOfIncome = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [backLink("/have-evidence"), caption, heading, employedEvidenceGroup, selfEmployedEvidenceGroup, benefitsInKindEvidenceGroup, otherEvidenceGroup, stateBenefitsEvidenceGroup, asylumSupportEvidenceGroup, taxCreditsEvidenceGroup, continueButton],
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
