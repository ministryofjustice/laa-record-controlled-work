import { Condition, Data, Format } from "@ministryofjustice/hmpps-forge/core/authoring";
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

export const selectedOfficeSingle = GovUKBody({
  text: Format(
    `<p class="govuk-body">${t("pages.yourCases.office")}: %1 (%2)</p>`,
    Data(CONTEXT_DATA_KEYS.selectedOffice).path("displayName"),
    Data(CONTEXT_DATA_KEYS.selectedOffice).path("code")
  ),
  visibleWhen: (Data(CONTEXT_DATA_KEYS.singleOffice)).match(Condition.Equals(true)),
});

export const selectedOfficeMultiple = GovUKBody({
  text: Format(
    `<p class="govuk-body">${t("pages.yourCases.office")}: %1 (%2) <a class="govuk-link govuk-!-margin-left-2" href="/select-office/">${t("common.change")}</a></p>`,
    Data(CONTEXT_DATA_KEYS.selectedOffice).path("displayName"),
    Data(CONTEXT_DATA_KEYS.selectedOffice).path("code")
  ),
  visibleWhen: (Data(CONTEXT_DATA_KEYS.singleOffice)).match(Condition.Equals(false)),
});

export const createCaseButton = GovUKLinkButton({
  href: "/cases/new/",
  text: t("pages.yourCases.createCaseButton"),
});
