import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBackLink,
  GovUKButton,
  GovUKHeading,
  GovUKTextInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

export const caption = (text: string): HtmlBlock =>
  HtmlBlock({
    content: `<span class="govuk-caption-l">${text}</span>`,
  });

export const backLink = (url: string): GovUKBackLink =>
  GovUKBackLink({
    href: url,
  });

export const heading = (text: string): HtmlBlock => GovUKHeading({ text });

export const continueButton = GovUKButton({ text: t("common.continue") });

export const submitButton = GovUKButton({
  text: t("common.submit"),
});

export const requiredTextInput = (
  code: string,
  text: string,
  requiredMessage: string,
  labelClasses = "govuk-label--m",
): ReturnType<typeof GovUKTextInput> =>
  GovUKTextInput({
    code,
    label: {
      classes: labelClasses,
      isPageHeading: false,
      text,
    },
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: requiredMessage,
      }),
    ],
  });
