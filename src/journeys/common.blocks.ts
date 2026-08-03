import type { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";

import {
  GovUKBackLink,
  GovUKButton,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

export const backLink = (url: string): GovUKBackLink =>
  GovUKBackLink({
    href: url,
  });

export const heading = (text: string): HtmlBlock => GovUKHeading({ text });

export const submitButton = GovUKButton({
  text: t("common.submit"),
});
