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
      buttonType: "submit",
      text: t("common.continue"),
    }),
    GovUKButton({
      buttonType: "submit",
      classes: "govuk-button--secondary",
      text: t("common.saveAndReturn"),
    }),
  ],
});
