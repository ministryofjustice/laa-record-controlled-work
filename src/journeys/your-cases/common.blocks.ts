import { Data, Format } from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKHeading,
  GovUKLinkButton,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

export const heading = GovUKHeading({
  level: H1,
  text: t("pages.yourCases.heading"),
});

export const selectedOffice = GovUKBody({
  text: Format(
    "%1: %2 (%3)",
    t("pages.yourCases.office"),
    Data(CONTEXT_DATA_KEYS.selectedOffice).path("displayName"),
    Data(CONTEXT_DATA_KEYS.selectedOffice).path("code"),
  ),
});

export const createCaseButton = GovUKLinkButton({
  href: "/cases/new/",
  text: t("pages.yourCases.createCaseButton"),
});
