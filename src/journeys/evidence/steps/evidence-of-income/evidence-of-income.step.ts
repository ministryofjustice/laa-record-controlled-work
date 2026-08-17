import {
  Answer,
  Condition,
  Format,
  or,
  Params,
  Query,
  redirect,
  step,
  submit,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  asylumSupportEvidenceGroup,
  benefitsInKindEvidenceGroup,
  description,
  employedEvidenceGroup,
  heading,
  otherEvidenceGroup,
  selfEmployedEvidenceGroup,
  stateBenefitsEvidenceGroup,
  taxCreditsEvidenceGroup,
} from "#/journeys/evidence/steps/evidence-of-income/evidence-of-income.blocks.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { backLink, caption, continueButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

export const evidenceOfIncome = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink(
        Format(
          "/cases/%1/evidence/have-evidence",
          Params(PARAMS_KEYS.applicationID),
        ),
      ),
      caption(t("journeys.evidence.caption")),
      heading,
      description,
      employedEvidenceGroup,
      selfEmployedEvidenceGroup,
      benefitsInKindEvidenceGroup,
      otherEvidenceGroup,
      stateBenefitsEvidenceGroup,
      asylumSupportEvidenceGroup,
      taxCreditsEvidenceGroup,
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
            redirect({ goto: "evidence-of-expenditure" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/evidence-of-income",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.evidence.evidenceOfIncome.title"),
    validWhen: [
      validation({
        condition: or(
          Answer("employedEvidence").match(Condition.IsRequired()),
          Answer("selfEmployedEvidence").match(Condition.IsRequired()),
          Answer("benefitsInKindEvidence").match(Condition.IsRequired()),
          Answer("otherEvidence").match(Condition.IsRequired()),
          Answer("stateBenefitsEvidence").match(Condition.IsRequired()),
          Answer("asylumSupportEvidence").match(Condition.IsRequired()),
          Answer("taxCreditsEvidence").match(Condition.IsRequired()),
        ),
        message: t("journeys.evidence.evidenceOfIncome.validation.required"),
      }),
    ],
  });
