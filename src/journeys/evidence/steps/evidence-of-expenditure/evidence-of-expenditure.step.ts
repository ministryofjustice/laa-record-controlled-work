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
  childCareEvidenceGroup,
  description,
  heading,
  housingCostsEvidenceGroup,
  incomeEvidenceGroup,
  label,
  maintenanceEvidenceGroup,
} from "#/journeys/evidence/steps/evidence-of-expenditure/evidence-of-expenditure.blocks.js";
import { t } from "#/lib/i18n.js";

export const evidenceOfExpenditure = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink("/cases/evidence/evidence-of-income"),
      caption,
      heading,
      description,
      label,
      incomeEvidenceGroup,
      housingCostsEvidenceGroup,
      childCareEvidenceGroup,
      maintenanceEvidenceGroup,
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
            redirect({ goto: "evidence-of-capital" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/evidence-of-expenditure",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.evidence.evidenceOfExpenditure.title"),
  });
