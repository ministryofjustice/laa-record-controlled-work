import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  GovUKBackLink,
  GovUKButton,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

export const continueButton = GovUKButton({ text: t("common.continue") });

export const backLink = (url: ResolvableString): GovUKBackLink =>
  GovUKBackLink({
    href: url,
  });
