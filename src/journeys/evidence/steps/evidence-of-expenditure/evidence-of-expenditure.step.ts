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
  childCareEvidenceGroup,
  description,
  employedEvidenceGroup,
  heading,
  housingCostsEvidenceGroup,
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
      employedEvidenceGroup,
      housingCostsEvidenceGroup,
      childCareEvidenceGroup,
      maintenanceEvidenceGroup,
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
            redirect({ goto: "evidence-of-capital" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/evidence-of-expenditure",
    reachability: { entryWhen: true },
    title: t("journeys.evidence.evidenceOfExpenditure.title"),
  });
