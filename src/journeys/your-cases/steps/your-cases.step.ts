import {
  Data,
  Format,
  Item,
  Iterator,
  step,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKLinkButton,
  GovUKHeading,
  GovUKTable,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";
import { H1 } from "#/lib/constants/headings.js";
import { MOJSubNavigation } from "@ministryofjustice/hmpps-forge/moj-components";

export const yourCasesStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKHeading({
        level: H1,
        text: "Your cases",
      }),
      GovUKLinkButton({
        text: t("pages.yourCases.createCaseButton"),
        href: "/create-application",
      }),
      MOJSubNavigation({
        items: [
          {
            text: t("pages.yourCases.tabs.inProgress"),
            href: "/your-cases",
            active: true,
          },
          {
            text: t("pages.yourCases.tabs.recorded"),
            href: "/your-cases-recorded",
          },
        ],
      }),
      GovUKTable({
        head: [
          { text: t("pages.yourCases.table.columns.clientName") },
          { text: t("pages.yourCases.table.columns.referenceNumber") },
          { text: t("pages.yourCases.table.columns.lastUpdated") },
        ],
        rows: Data("caseList").each(
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
              text: Item().path("lastUpdated").pipe(
                Transformer.String.FormatDate({
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  locale: "en-GB",
                }),
              ),
            },
          ]),
        ),
      }),
    ],
    path: "/",
    title: "Your Cases",
  });
