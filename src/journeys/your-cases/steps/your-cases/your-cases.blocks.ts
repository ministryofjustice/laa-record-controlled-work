import { Case } from "#/journeys/your-cases/journey.types.js";
import { H1 } from "#/lib/constants/headings.js";
import {
  Format,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKHeading,
  GovUKLinkButton,
  GovUKTable,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { MOJSubNavigation } from "@ministryofjustice/hmpps-forge/moj-components";
import { t } from "i18next";

export const heading = GovUKHeading({
  level: H1,
  text: "Your cases",
});

export const createCaseButton = GovUKLinkButton({
  href: "/create-application",
  text: t("pages.yourCases.createCaseButton"),
});

export const subNavigation = MOJSubNavigation({
  items: [
    {
      active: true,
      href: "/your-cases",
      text: t("pages.yourCases.tabs.inProgress"),
    },
    {
      href: "/your-cases-recorded",
      text: t("pages.yourCases.tabs.recorded"),
    },
  ],
});

export const casesTable = (cases: Case[]) =>
  GovUKTable({
    head: [
      { text: t("pages.yourCases.table.columns.clientName") },
      { text: t("pages.yourCases.table.columns.referenceNumber") },
      { text: t("pages.yourCases.table.columns.lastUpdated") },
    ],
    rows: cases.map((caseItem: Case) => [
      {
        html: Format(
          '<a class="govuk-link" href="/cases/%1">%2</a>',
          caseItem.referenceNumber,
          caseItem.clientName,
        ),
      },
      { text: caseItem.referenceNumber },
      { text: caseItem.lastUpdated },
    ]),
  });
