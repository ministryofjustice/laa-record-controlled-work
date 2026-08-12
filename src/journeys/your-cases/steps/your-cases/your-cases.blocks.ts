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

import {
  APPLICATIONS_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";
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
            '<a class="govuk-link" href="/cases/%1/task-list">%2</a>',
            Item().path(APPLICATIONS_DATA_KEYS.id),
            Item().path(APPLICATIONS_DATA_KEYS.name),
          ),
        },
        { text: Item().path(APPLICATIONS_DATA_KEYS.applicationRefNumber) },
        {
          text: Item()
            .path(APPLICATIONS_DATA_KEYS.modifiedAt)
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
    visibleWhen: Data(CONTEXT_DATA_KEYS.caseList).match(Condition.IsRequired()),
  });

export const noCasesMessage = GovUKBody({
  text: t("pages.yourCases.table.emptyMessage.inProgress"),
  visibleWhen: Data(CONTEXT_DATA_KEYS.caseList).not.match(
    Condition.IsRequired(),
  ),
});
