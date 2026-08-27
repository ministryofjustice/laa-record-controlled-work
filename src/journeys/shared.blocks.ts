import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  HtmlBlock,
} from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKButton,
  GovUKHeading,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

/**
 * Creates a GovUK-styled caption block with the given text.
 *
 * @param {string} text - The caption text content
 * @returns {HtmlBlock} A caption HTML block with GovUK styling
 */
export function caption(text: string): HtmlBlock {
  return HtmlBlock({
    content: `<span class="govuk-caption-l">${text}</span>`,
  });
}

/**
 * Creates a caption block with the client details text.
 *
 * @returns {HtmlBlock} A caption HTML block with the application client details text
 */
export function clientDetailsCaption(): HtmlBlock {
  return caption(t("journeys.createApplication.caption"));
}

/**
 * Creates a GovUK-styled continue button.
 *
 * @returns {GovUKButton} A GovUK button component with "continue" text
 */
export function continueButton(): GovUKButton {
  return button(t("common.continue"));
}
/**
 * Creates a GovUK-styled H1 heading component.
 *
 * @param {string} text - The heading text content
 * @returns {HtmlBlock} A GovUK heading component
 */
export function heading(text: string): HtmlBlock {
  return GovUKHeading({
    level: H1,
    text,
  });
}

export const submitButton = GovUKButton({
  text: t("common.submit"),
});

/**
 * Creates a GovUK-styled button with custom text.
 *
 * @param {string} text - The button text content
 * @returns {GovUKButton} A GovUK button component
 */
export function button(text: string): GovUKButton {
  return GovUKButton({ text });
}

/**
 * Creates a GovUK-styled yes/no radio input with validation.
 * Presents two mutually exclusive options (yes/no) with error messaging.
 *
 * @param {string} code - The field code/answer key identifier
 * @param {string} question - The question text displayed as the legend
 * @param {string} validationErrorMessage - The error message shown if no selection is made
 * @param {boolean} [isPageHeading=true] - Whether the legend should be styled as a page heading
 * @returns {GovUKRadioInput} A GovUK radio input component with yes/no options
 */
export function yesOrNoRadioInput(
  code: string,
  question: string,
  validationErrorMessage: string,
  isPageHeading = true,
): GovUKRadioInput {
  return GovUKRadioInput({
    code,
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--l",
        isPageHeading,
        text: question,
      },
    },
    items: [
      {
        text: t("common.yes"),
        value: "yes",
      },
      {
        text: t("common.no"),
        value: "no",
      },
    ],
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: validationErrorMessage,
      }),
    ],
  });
}
