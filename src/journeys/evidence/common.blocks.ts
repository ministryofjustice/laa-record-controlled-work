import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBackLink,
  GovUKButton,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "#/lib/i18n.js";

export const backLink = (url: string): GovUKBackLink =>
  GovUKBackLink({
    href: url,
  });

export const caption = HtmlBlock({
  content: `<span class="govuk-caption-l">${t("journeys.evidence.caption")}</span>`,
});

export const continueButton = GovUKButton({ text: t("common.continue") });

export const submitButton = GovUKButton({
  text: t("common.submit"),
});
