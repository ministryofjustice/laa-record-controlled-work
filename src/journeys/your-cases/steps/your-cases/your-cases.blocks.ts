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
  GovUKTable,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { MOJSubNavigation } from "@ministryofjustice/hmpps-forge/moj-components";

import { t } from "#/lib/i18n.js";

export const subNavigation = MOJSubNavigation({
  items: [
    {
      active: true,
      href: "/cases",
      text: t("pages.yourCases.tabs.inProgress"),
    },
    {
      href: "/cases/recorded",
      text: t("pages.yourCases.tabs.recorded"),
    },
    {
      href: "/cases/ineligible",
      text: t("pages.yourCases.tabs.ineligible"),
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
            '<a class="govuk-link" href="/cases/%1/task-list/">%2</a>',
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
    visibleWhen: Data("caseList").match(Condition.IsRequired()),
  });

export const noCasesMessage = GovUKBody({
  text: t("pages.yourCases.table.emptyMessage.inProgress"),
  visibleWhen: Data("caseList").not.match(Condition.IsRequired()),
});
