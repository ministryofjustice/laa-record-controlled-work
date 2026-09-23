import {
  Answer,
  Condition,
  or,
  Query,
  redirect,
  step,
  submit,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  childCareEvidenceGroup,
  heading,
  housingCostsEvidenceGroup,
  incomeEvidenceGroup,
  label,
  maintenanceEvidenceGroup,
} from "#/journeys/evidence/steps/evidence-of-expenditure/evidence-of-expenditure.blocks.js";
import { caption, continueButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.evidence.evidenceOfExpenditure.title"); 
const VALIDATION_REQUIRED = t("journeys.evidence.evidenceOfExpenditure.validation.required");

export const evidenceOfExpenditure = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      caption(t("journeys.evidence.caption")),
      heading,
      label,
      incomeEvidenceGroup,
      housingCostsEvidenceGroup,
      childCareEvidenceGroup,
      maintenanceEvidenceGroup,
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
            redirect({ goto: "have-evidence-of-capital" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/evidence-of-expenditure",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: TITLE,
    validWhen: [
      validation({
        condition: or(
          Answer("incomeEvidence").match(Condition.IsRequired()),
          Answer("housingCostsEvidence").match(Condition.IsRequired()),
          Answer("childCareEvidence").match(Condition.IsRequired()),
          Answer("maintenanceEvidence").match(Condition.IsRequired()),
        ),
        message: VALIDATION_REQUIRED,
      }),
    ],
  });
