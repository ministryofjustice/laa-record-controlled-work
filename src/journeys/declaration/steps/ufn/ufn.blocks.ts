import { AnswerKey } from "#/journeys/declaration/declaration.answers.js";
import { t } from "#/lib/i18n.js";
import {
  validation,
  Self,
  Condition,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { BlockDefinition } from "@ministryofjustice/hmpps-forge/core/components";
import { GovUKButton, GovUKButtonGroup, GovUKTextInput } from "@ministryofjustice/hmpps-forge/govuk-components";

export function ufnInput(): GovUKTextInput {
  return GovUKTextInput({
    code: AnswerKey.DECLARATION_UFN,
    label: {
      text: t("journeys.declaration.ufn.title"),
      isPageHeading: true,
    },
    hint: {
      text: t("journeys.declaration.ufn.hint"),
    },
    classes: "govuk-!-width-one-third",
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: t("journeys.declaration.ufn.validation.required"),
      }),
    ],
  });
}

export const continueReturnButtons = (): BlockDefinition => {
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
};
