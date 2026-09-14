import type {
  ResolvableBoolean,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

import {
  Answer,
  Condition,
  match,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKSummaryList } from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import {
  formatAddressValue,
  formatChangeAddressRedirect,
  formatEcfLabel,
  formatLegalAidBeforeLabel,
  formatLegalAidLast6MonthsLabel,
} from "#/journeys/create-application/steps/checkAnswers/checkAnswers.formatters.js";
import { formatDateOfBirth } from "#/journeys/view-application/steps/client-details.formatter.js";
import { t } from "#/lib/i18n.js";

interface SummaryRow {
  actions: {
    items: Array<{
      href: ResolvableString;
      text: ResolvableString;
      visuallyHiddenText: ResolvableString;
    }>;
  };
  key: { text: ResolvableString };
  value: { html?: ResolvableString; text?: ResolvableString };
  visibleWhen?: ResolvableBoolean;
}

interface SummaryRowArgs {
  href: ResolvableString;
  labelKey: string;
  value: {
    html?: ResolvableString;
    text?: ResolvableString;
  };
  visibleWhen?: ResolvableBoolean;
}

/**
 * Creates the check-answers summary list.
 *
 * @returns The check-answers summary list.
 */
export function summaryList(): GovUKSummaryList {
  return GovUKSummaryList({
    rows: [
      summaryRow({
        href: "ecf?returnTo=check-answers",
        labelKey: "journeys.createApplication.checkAnswers.answerLabels.ecf",
        value: { text: formatEcfLabel() },
      }),
      summaryRow({
        href: "legal-aid-before?returnTo=check-answers",
        labelKey:
          "journeys.createApplication.checkAnswers.answerLabels.legalAidBefore",
        value: { text: formatLegalAidBeforeLabel() },
      }),
      summaryRow({
        href: "legal-aid-last-6-months?returnTo=check-answers",
        labelKey:
          "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6Months",
        value: { text: formatLegalAidLast6MonthsLabel() },
        visibleWhen: Answer(AnswerKey.legalAidBefore).match(
          Condition.Equals("yesSameMatter"),
        ),
      }),
      summaryRow({
        href: "legal-aid-last-6-months?returnTo=check-answers",
        labelKey:
          "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6MonthsReasonForYes",
        value: { text: Answer(AnswerKey.reasonForYes) },
        visibleWhen: Answer(AnswerKey.legalAidLast6Months).match(
          Condition.Equals("yes"),
        ),
      }),
      summaryRow({
        href: "client-details?returnTo=check-answers",
        labelKey:
          "journeys.createApplication.checkAnswers.answerLabels.firstName",
        value: { text: Answer(AnswerKey.firstName) },
      }),
      summaryRow({
        href: "client-details?returnTo=check-answers",
        labelKey:
          "journeys.createApplication.checkAnswers.answerLabels.lastName",
        value: { text: Answer(AnswerKey.lastName) },
      }),
      summaryRow({
        href: "client-details?returnTo=check-answers",
        labelKey:
          "journeys.createApplication.checkAnswers.answerLabels.dateOfBirth",
        value: { text: formatDateOfBirth() },
      }),
      summaryRow({
        href: "ni-number?returnTo=check-answers",
        labelKey:
          "journeys.createApplication.checkAnswers.answerLabels.niNumber",
        value: {
          text: match(Answer(AnswerKey.hasNINumber))
            .branch(Condition.Equals("yes"), Answer(AnswerKey.niNumber))
            .otherwise(t("common.no")),
        },
      }),
      summaryRow({
        href: "have-a-home-address?returnTo=check-answers",
        labelKey:
          "journeys.createApplication.checkAnswers.answerLabels.haveAHomeAddress",
        value: {
          text: match(Answer(AnswerKey.haveAHomeAddress))
            .branch(Condition.Equals("yes"), t("common.yes"))
            .otherwise(t("common.no")),
        },
      }),
      summaryRow({
        href: formatChangeAddressRedirect(),
        labelKey:
          "journeys.createApplication.checkAnswers.answerLabels.address",
        value: { html: formatAddressValue() },
      }),
    ],
  });
}

/**
 * Creates a summary row with a GOV.UK change action.
 *
 * @param args Summary row configuration.
 * @returns A configured summary row.
 */
function summaryRow(args: SummaryRowArgs): SummaryRow {
  const { href, labelKey, value, visibleWhen } = args;

  return {
    actions: {
      items: [
        {
          href,
          text: t("common.change"),
          visuallyHiddenText: t(labelKey),
        },
      ],
    },
    key: {
      text: t(labelKey),
    },
    value,
    ...(visibleWhen === undefined ? {} : { visibleWhen }),
  };
}
