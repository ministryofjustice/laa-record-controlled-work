import { GovUKBackLink, GovUKButton } from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";
import { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

export const continueButton = GovUKButton({ text: t("common.continue") });

export const backLink = (url: ResolvableString): GovUKBackLink =>
  GovUKBackLink({
    href: url,
  });