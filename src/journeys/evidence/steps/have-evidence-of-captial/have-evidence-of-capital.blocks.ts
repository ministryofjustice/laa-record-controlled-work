import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

/**
 * Renders the description text for the "Have evidence of capital" step.
 * @returns {GovUKBody} The description text component.
 */
export function description(): GovUKBody {
  return GovUKBody({
    classes: "govuk-body",
    text: t("journeys.evidence.haveEvidenceOfCapital.description"),
  });
}

/**
 * Renders the radio input for the "Have evidence of capital" step.
 * @returns {GovUKRadioInput} The radio input component.
 */
export function haveEvidenceOfCapitalRadioInput(): GovUKRadioInput {
  return GovUKRadioInput({
    code: "haveEvidenceOfCapital",
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
          "journeys.evidence.haveEvidenceOfCapital.validation.required",
        ),
      }),
    ],
  });
}
