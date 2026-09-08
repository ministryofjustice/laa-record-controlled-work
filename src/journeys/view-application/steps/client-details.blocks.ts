import {
  Condition,
  Data,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKSummaryList } from "@ministryofjustice/hmpps-forge/govuk-components";
import { MOJSubNavigation } from "@ministryofjustice/hmpps-forge/moj-components";

import {
  CLIENT_DETAILS_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";
import { clientName } from "#/journeys/view-application/common.blocks.js";
import {
  formatAddress,
  formatDateOfBirth,
} from "#/journeys/view-application/steps/client-details.formatter.js";
import { t } from "#/lib/i18n.js";

/**
 *  Render the data about the client in a summary card
 *  @returns GovUKSummaryList component
 */
export function aboutTheClientSummaryCard(): ReturnType<
  typeof GovUKSummaryList
> {
  return GovUKSummaryList({
    card: {
      title: {
        text: t("pages.view.summaryCardTitles.aboutTheClient"),
      },
    },
    rows: [
      {
        key: {
          text: t("pages.view.summaryCardRows.fullName"),
        },
        value: {
          text: clientName,
        },
      },
      {
        key: {
          text: t("pages.view.summaryCardRows.dateOfBirth"),
        },
        value: {
          text: formatDateOfBirth(),
        },
      },
      {
        key: {
          text: t("pages.view.summaryCardRows.nationalInsuranceNumber"),
        },
        value: {
          text: Data(CONTEXT_DATA_KEYS.application).path(
            CLIENT_DETAILS_DATA_KEYS.niNumber,
          ),
        },
        visibleWhen: Data(CONTEXT_DATA_KEYS.application)
          .path(CLIENT_DETAILS_DATA_KEYS.niNumber)
          .match(Condition.IsRequired()),
      },
      {
        key: {
          text: t("pages.view.summaryCardRows.address"),
        },
        value: {
          html: formatAddress(),
        },
        visibleWhen: Data(CONTEXT_DATA_KEYS.application)
          .path(CLIENT_DETAILS_DATA_KEYS.hasFixedAddress)
          .match(Condition.Equals(true)),
      },
      {
        key: {
          text: t("pages.view.summaryCardRows.legalAidBefore"),
        },
        value: {
          text: Data(CONTEXT_DATA_KEYS.application)
            .path("scopingQuestions.priorLegalAid")
            .pipe(Transformer.String.Capitalize()),
        },
      },
    ],
  });
}

/**
 *  Render the data about the case in a summary card
 *  @returns GovUKSummaryList component
 */
export function caseDetailsSummaryCard(): ReturnType<typeof GovUKSummaryList> {
  return GovUKSummaryList({
    card: {
      title: {
        text: t("pages.view.summaryCardTitles.caseDetails"),
      },
    },
    rows: [
      {
        key: {
          text: t("pages.view.summaryCardRows.ecf"),
        },
        value: {
          text: "False",
        },
      },
    ],
  });
}

/**
 *  Render the subnavigation with the current page set to active
 *  @returns MOJSubNavigation component
 */
export function subNavigation(): ReturnType<typeof MOJSubNavigation> {
  return MOJSubNavigation({
    items: [
      {
        active: true,
        href: "client-details",
        text: t("pages.view.tabs.ClientDetails"),
      },
      {
        href: "means-assessment",
        text: t("pages.view.tabs.meansAssessment"),
      },
      {
        href: "evidence",
        text: t("pages.view.tabs.evidence"),
      },
    ],
  });
}
