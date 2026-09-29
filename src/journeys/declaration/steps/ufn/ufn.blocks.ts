import type { BlockDefinition } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKButton,
  GovUKButtonGroup,
  GovUKTextInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/declaration/declaration.answers.js";
import { t } from "#/lib/i18n.js";

/**
 * Creates the continue and return buttons for the declaration journey.
 * @returns A configured GOV.UK button group block.
 */
export function continueReturnButtons(): BlockDefinition {
  return GovUKButtonGroup({
    buttons: [
      GovUKButton({
        buttonType: "submit",
        text: t("journeys.declaration.sign.continueButton"),
        value: "continue",
      }),
      GovUKButton({
        buttonType: "submit",
        classes: "govuk-button--secondary",
        text: t("common.saveAndReturn"),
        value: "return",
      }),
    ],
  });
}

/**
 * Creates the UFN input field for the declaration journey.
 * @returns A configured GOV.UK text input block for the UFN.
 */
export function ufnInput(): GovUKTextInput {
  return GovUKTextInput({
    classes: "govuk-!-width-one-third",
    code: AnswerKey.DECLARATION_UFN,
    hint: {
      text: t("journeys.declaration.ufn.hint"),
    },
    label: {
      classes: "govuk-fieldset__legend--l",
      isPageHeading: true,
      text: t("journeys.declaration.ufn.title"),
    },
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: t("journeys.declaration.ufn.validation.required"),
      }),
    ],
  });
}
