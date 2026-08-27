import {
  HtmlBlock,
} from "@ministryofjustice/hmpps-forge/core/components";

import { t } from "#/lib/i18n.js";

export const caption = HtmlBlock({
  content: `<span class="govuk-caption-l">${t("journeys.declaration.caption")}</span>`,
});
