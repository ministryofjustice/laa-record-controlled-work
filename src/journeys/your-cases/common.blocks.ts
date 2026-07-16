import { H1 } from "#/lib/constants/headings.js";
import { GovUKHeading, GovUKLinkButton } from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "i18next";

export const heading = GovUKHeading({
  level: H1,
  text: t("pages.yourCases.heading"),
});

export const createCaseButton = GovUKLinkButton({
  href: "/create-application",
  text: t("pages.yourCases.createCaseButton"),
});

