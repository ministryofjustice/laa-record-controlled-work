import {
  type ChainableRef,
  Format,
  Item,
  Iterator,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKHeading,
  GovUKLinkButton,
  GovUKTable,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { MOJSubNavigation } from "@ministryofjustice/hmpps-forge/moj-components";
import { t } from "i18next";

import { H1 } from "#/lib/constants/headings.js";

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

export const casesTable = (
  cases: ChainableRef,
): GovUKTable =>
  GovUKTable({
    head: [
      { text: t("pages.yourCases.table.columns.clientName") },
      { text: t("pages.yourCases.table.columns.referenceNumber") },
      { text: t("pages.yourCases.table.columns.lastUpdated") },
    ],
    rows: cases.each(
      Iterator.Map([
        {
          html: Format(
            '<a class="govuk-link" href="/cases/%1">%2</a>',
            Item().path("referenceNumber"),
            Item().path("clientName"),
          ),
        },
        { text: Item().path("referenceNumber") },
        {
          text: Item()
            .path("lastUpdated")
            .pipe(
              Transformer.String.FormatDate({
                day: "numeric",
                locale: "en-GB",
                month: "short",
                year: "numeric",
              }),
            ),
        },
      ]),
    ),
  });
