import {
  type ChainableRef,
  Condition,
  Data,
  Format,
  Item,
  Iterator,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKHeading,
  GovUKLinkButton,
  GovUKTable,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { MOJSubNavigation } from "@ministryofjustice/hmpps-forge/moj-components";

import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

export const heading = GovUKHeading({
  level: H1,
  text: t("pages.yourCases.heading"),
});

export const createCaseButton = GovUKLinkButton({
  href: "/create-application",
  text: t("pages.yourCases.createCaseButton"),
});

export const subNavigation = MOJSubNavigation({
  items: [
    {
      href: "/your-cases",
      text: t("pages.yourCases.tabs.inProgress"),
    },
    {
      href: "/your-cases-recorded",
      text: t("pages.yourCases.tabs.recorded"),
    },
    {
      active: true,
      href: "/your-cases-ineligible",
      text: t("pages.yourCases.tabs.ineligible"),
    },
  ],
});

export const casesTable = (cases: ChainableRef): GovUKTable =>
  GovUKTable({
    head: [
      { text: t("pages.yourCases.table.columns.clientName") },
      { text: t("pages.yourCases.table.columns.referenceNumber") },
      { text: t("pages.yourCases.table.columns.dateRecorded") },
    ],
    rows: cases.each(
      Iterator.Map([
        {
          html: Format(
            '<a class="govuk-link" href="/cases/%1">%2</a>',
            Item().path("applicationRefNumber"),
            Item().path("name"),
          ),
        },
        { text: Item().path("applicationRefNumber") },
        {
          text: Item()
            .path("modifiedAt")
            .pipe(
              Transformer.String.FormatDate({
                day: "numeric",
                locale: "en-GB",
                month: "short",
                timeZone: "Europe/London",
                year: "numeric",
              }),
            ),
        },
      ]),
    ),
    visibleWhen: Data("caseList")
      .pipe(Transformer.Array.Length())
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- self explanatory
      .match(Condition.Number.GreaterThan(0)),
  });

export const noCasesMessage = GovUKBody({
  text: t("pages.yourCases.table.emptyMessage.ineligible"),
  visibleWhen: Data("caseList")
    .pipe(Transformer.Array.Length())
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- self explanatory
    .match(Condition.Number.LessThanOrEqual(0)),
});
