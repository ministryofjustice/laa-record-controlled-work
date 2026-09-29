import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { EvidenceAnswers } from "#/journeys/evidence/evidence.answers.js";
import { t } from "#/lib/i18n.js";

/**
 * Renders the description text for the "Have evidence of expenditure" step.
 * @returns {GovUKBody} The description text component.
 */
export function description(): GovUKBody {
  return GovUKBody({
    classes: "govuk-body",
    text: t("journeys.evidence.haveEvidenceOfExpenditure.description"),
  });
}

/**
 * Renders the radio input for the "Have evidence of expenditure" step.
 * @returns {GovUKRadioInput} The radio input component.
 */
export function haveEvidenceOfExpenditureRadioInput(): GovUKRadioInput {
  return GovUKRadioInput({
    code: EvidenceAnswers.haveEvidenceOfExpenditure,
    items: [
      {
        text: t("common.yes"),
        value: "yes",
      },
      {
        text: t("journeys.evidence.haveEvidenceOfExpenditure.options.no"),
        value: "no",
      },
    ],
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: t(
          "journeys.evidence.haveEvidenceOfExpenditure.validation.required",
        ),
      }),
    ],
  });
}

/**
 * Renders the link for the "Have evidence of expenditure" step.
 * @returns {GovUKBody} The link component.
 */
export function link(): GovUKBody {
  return GovUKBody({
    text: `<a href="#" class="govuk-link">${t("journeys.evidence.haveEvidenceOfExpenditure.linkText")}</a>`,
  });
}
