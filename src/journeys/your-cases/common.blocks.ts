import {
  GovUKHeading,
  GovUKLinkButton,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "#/lib/i18n.js";

import { H1 } from "#/lib/constants/headings.js";

export const heading = GovUKHeading({
  level: H1,
  text: t("pages.yourCases.heading"),
});

export const createCaseButton = GovUKLinkButton({
  href: "/create-application",
  text: t("pages.yourCases.createCaseButton"),
});
