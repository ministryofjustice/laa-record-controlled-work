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
  APPLICATION_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

export const subNavigation = MOJSubNavigation({
  items: [
    {
      href: "/cases",
      text: t("pages.yourCases.tabs.inProgress"),
    },
    {
      href: "/cases/recorded",
      text: t("pages.yourCases.tabs.recorded"),
    },
    {
      active: true,
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
      { text: t("pages.yourCases.table.columns.dateRecorded") },
    ],
    rows: cases.each(
      Iterator.Map([
        {
          html: Format(
            '<a class="govuk-link" href="/cases/%1">%2</a>',
            Item().path(APPLICATION_DATA_KEYS.applicationRefNumber),
            Item().path(APPLICATION_DATA_KEYS.name),
          ),
        },
        { text: Item().path(APPLICATION_DATA_KEYS.applicationRefNumber) },
        {
          text: Item()
            .path(APPLICATION_DATA_KEYS.modifiedAt)
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
  text: t("pages.yourCases.table.emptyMessage.ineligible"),
  visibleWhen: Data(CONTEXT_DATA_KEYS.caseList).not.match(
    Condition.IsRequired(),
  ),
});
