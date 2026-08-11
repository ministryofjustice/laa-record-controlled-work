import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBackLink,
  GovUKButton,
  GovUKButtonGroup,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

export const backLink = (url: string): GovUKBackLink =>
  GovUKBackLink({
    href: url,
  });

export const caption = HtmlBlock({
  content: `<span class="govuk-caption-l">${t("journeys.declaration.caption")}</span>`,
});

export const buttonGroup = GovUKButtonGroup({
  buttons: [
    GovUKButton({
      text: t("common.continue"),
      buttonType: "submit",
    }),
    GovUKButton({
      text: t("common.saveAndReturn"),
      classes: "govuk-button--secondary",
      buttonType: "submit",
    }),
  ],
});