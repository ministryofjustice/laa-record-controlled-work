import {
  GovUKHeading,
  GovUKLinkButton,
  GovUKBody,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";
import { Data, Format } from "@ministryofjustice/hmpps-forge/core/authoring";

export const heading = GovUKHeading({
  level: H1,
  text: t("pages.yourCases.heading"),
});

export const selectedOffice = GovUKBody({
  text: Format(
    "%1: %2 (%3)",
    t("pages.yourCases.office"),
    Data("selectedOffice").path("displayName"),
    Data("selectedOffice").path("code"),
  ),
});

export const createCaseButton = GovUKLinkButton({
  href: "/cases/new/",
  text: t("pages.yourCases.createCaseButton"),
});
