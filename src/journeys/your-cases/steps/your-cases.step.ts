import {
  Data,
  Format,
  Item,
  Iterator,
  step,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKHeading,
  GovUKLinkButton,
  GovUKTable,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { MOJSubNavigation } from "@ministryofjustice/hmpps-forge/moj-components";

import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

export const yourCasesStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKHeading({
        level: H1,
        text: "Your cases",
      }),
      GovUKLinkButton({
        href: "/create-application",
        text: t("pages.yourCases.createCaseButton"),
      }),
      MOJSubNavigation({
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
      }),
    ],
    path: "/",
    title: "Your Cases",
  });
