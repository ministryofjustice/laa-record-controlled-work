import {
  Condition,
  Format,
  Params,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

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
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { backLink, caption, continueButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

export const evidenceOfExpenditure = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink(
        Format(
          "/cases/%1/evidence/evidence-of-income",
          Params(PARAMS_KEYS.applicationID),
        ),
      ),
      caption(t("journeys.evidence.caption")),
      heading,
      description,
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
