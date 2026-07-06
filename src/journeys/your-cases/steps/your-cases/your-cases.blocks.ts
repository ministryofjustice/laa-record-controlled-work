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

export const casesTable = (cases: ChainableRef): GovUKTable =>
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
                year: "numeric",
              }),
            ),
        },
      ]),
    ),
    // TODO replace with arr.length when transformer is available
    visibleWhen: Data("caseList")
      .pipe(Transformer.Array.Length())
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- temporary
      .match(Condition.Number.GreaterThan(0)),
  });

export const noCasesMessage = GovUKBody({
  text: t("pages.yourCases.table.emptyMessage"),
  visibleWhen: Data("caseList")
    .pipe(Transformer.Array.Length())
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- temporary
    .match(Condition.Number.LessThanOrEqual(0)),
});
