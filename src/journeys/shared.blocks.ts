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

export const backLink = (url: ResolvableString): GovUKBackLink =>
  GovUKBackLink({
    href: url,
  });

export const heading = (text: string): HtmlBlock =>
  GovUKHeading({
    level: H1,
    text,
  });

export const caption = HtmlBlock({
  content: `<span class="govuk-caption-l">${t("journeys.evidence.caption")}</span>`,
});

export const continueButton = (): GovUKButton =>
  GovUKButton({ text: t("common.continue") });

export const submitButton = GovUKButton({
  text: t("common.submit"),
});

export const button = (text: string): GovUKButton => GovUKButton({ text });
