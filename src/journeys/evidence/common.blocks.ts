import {
  HtmlBlock
} from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKButton,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

export const caption = HtmlBlock({
  content: `<span class="govuk-caption-l">${t("journeys.evidence.caption")}</span>`,
});

export const continueButton = GovUKButton({ text: t("common.continue") });

export const submitButton = GovUKButton({
  text: t("common.submit"),
});
