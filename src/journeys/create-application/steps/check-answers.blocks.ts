import type {
  ResolvableBoolean,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

import {
  Answer,
  Condition,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKHeading,
  GovUKSummaryList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import {
  addressChangeHref,
  addressValueDisplay,
  dateOfBirthDisplay,
  ecfLabel,
  legalAidBeforeLabel,
  legalAidLast6MonthsLabel,
} from "#/journeys/create-application/steps/check-answers.formatters.js";
import { t } from "#/lib/i18n.js";

interface ChangeRowArgs {
  href: ResolvableString;
  labelKey: string;
  value: {
    html?: ResolvableString;
    text?: ResolvableString;
  };
  visibleWhen?: ResolvableBoolean;
}

/**
 * Build a standard summary row with GOV.UK change action.
 * @param args Row configuration.
 * @returns Summary list row.
 */
function SummaryRow(args: ChangeRowArgs): {
  actions: {
    items: Array<{
      href: ResolvableString;
      text: string;
      visuallyHiddenText: string;
    }>;
  };
  key: { text: string };
  value: { html?: ResolvableString; text?: ResolvableString };
  visibleWhen?: ResolvableBoolean;
} {
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

export const heading = GovUKHeading({
  text: t("journeys.createApplication.checkAnswers.title"),
});

export const summaryList = GovUKSummaryList({
  rows: [
    SummaryRow({
      href: "ecf?returnTo=check-answers",
      labelKey: "journeys.createApplication.checkAnswers.answerLabels.ecf",
      value: { text: ecfLabel },
    }),
    SummaryRow({
      href: "legal-aid-before?returnTo=check-answers",
      labelKey:
        "journeys.createApplication.checkAnswers.answerLabels.legalAidBefore",
      value: { text: legalAidBeforeLabel },
    }),
    SummaryRow({
      href: "legal-aid-last-6-months?returnTo=check-answers",
      labelKey:
        "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6Months",
      value: { text: legalAidLast6MonthsLabel },
      visibleWhen: Answer("legalAidBefore").match(
        Condition.Equals("yesSameMatter"),
      ),
    }),
    SummaryRow({
      href: "legal-aid-last-6-months?returnTo=check-answers",
      labelKey:
        "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6MonthsReasonForYes",
      value: { text: Answer("reasonForYes") },
      visibleWhen: Answer("legalAidLast6Months").match(Condition.Equals("yes")),
    }),
    SummaryRow({
      href: "client-details?returnTo=check-answers",
      labelKey:
        "journeys.createApplication.checkAnswers.answerLabels.firstName",
      value: { text: Answer("firstName") },
    }),
    SummaryRow({
      href: "client-details?returnTo=check-answers",
      labelKey: "journeys.createApplication.checkAnswers.answerLabels.lastName",
      value: { text: Answer("lastName") },
    }),
    SummaryRow({
      href: "client-details?returnTo=check-answers",
      labelKey:
        "journeys.createApplication.checkAnswers.answerLabels.dateOfBirth",
      value: { text: dateOfBirthDisplay },
    }),
    SummaryRow({
      href: "ni-number?returnTo=check-answers",
      labelKey: "journeys.createApplication.checkAnswers.answerLabels.niNumber",
      value: { text: Answer("niNumber") },
      visibleWhen: Answer("hasNINumber").match(Condition.Equals("yes")),
    }),
    SummaryRow({
      href: addressChangeHref,
      labelKey: "journeys.createApplication.checkAnswers.answerLabels.address",
      value: { html: addressValueDisplay },
    }),
  ],
});
