import {
  HtmlBlock,
  type ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBackLink,
  GovUKButton,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

/**
 * Creates a GovUK-styled back link component.
 *
 * @param {ResolvableString} url - The URL destination for the back link
 * @returns {GovUKBackLink} A GovUK back link component
 */
export function backLink(url: ResolvableString): GovUKBackLink {
  return GovUKBackLink({
    href: url,
  });
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

export const caption = HtmlBlock({
  content: `<span class="govuk-caption-l">${t("journeys.evidence.caption")}</span>`,
});

/**
 * Creates a GovUK-styled continue button with localized text.
 *
 * @returns {GovUKButton} A GovUK button component with "continue" text
 */
export function continueButton(): GovUKButton {
  return button(t("common.continue"));
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
