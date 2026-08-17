import {
  HtmlBlock,
  type ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";
import { GovUKBackLink } from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

export const backLink = (url: ResolvableString): GovUKBackLink =>
  GovUKBackLink({
    attributes: { id: "back-link" },
    href: url,
  });

export const caption = HtmlBlock({
  content: `<span class="govuk-caption-l">${t("journeys.declaration.caption")}</span>`,
});
