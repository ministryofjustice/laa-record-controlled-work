import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBackLink,
  GovUKButton,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

/**
 *
 * @param href
 */
export function backlink(href: string): GovUKBackLink {
  return GovUKBackLink({
    href,
  });
}

/**
 *
 * @param title
 */
export function button(title: string): GovUKButton {
  return GovUKButton({ text: title });
}

/**
 *
 * @param captionTitle
 */
export function captionTitle(captionTitle: string): HtmlBlock {
  return HtmlBlock({
    content: `<span class="govuk-caption-l">${captionTitle}</span>`,
  });
}

/**
 *
 * @param code
 * @param title
 * @param validationMessage
 */
export function yesNoRadioInput(
  code: string,
  title: string,
  validationMessage: string,
): GovUKRadioInput {
  return GovUKRadioInput({
    code,
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--l",
        isPageHeading: true,
        text: title,
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
        message: validationMessage,
      }),
    ],
  });
}
