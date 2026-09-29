import { AnswerKey } from "#/journeys/declaration/declaration.answers.js";
import { formatDate } from "#/journeys/declaration/steps/checkAnswers/checkAnswers.formatters.js";
import { fixedT } from "#/lib/i18n.js";
import { Answer } from "@ministryofjustice/hmpps-forge/core/authoring";
import { ResolvableString, ResolvableBoolean } from "@ministryofjustice/hmpps-forge/core/components";
import { GovUKSummaryList } from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "i18next";

const answerLabelT = fixedT(
  "journeys.declaration.checkAnswers.answerLabels",
);

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
  label: ResolvableString;
  value: {
    html?: ResolvableString;
    text?: ResolvableString;
  };
  visibleWhen?: ResolvableBoolean;
}

/**
 * Creates a summary row with a GOV.UK change action.
 *
 * @param args Summary row configuration.
 * @returns A configured summary row.
 */
function summaryRow(args: SummaryRowArgs): SummaryRow {
  const { href, label, value, visibleWhen } = args;

  return {
    actions: {
      items: [
        {
          href,
          text: t("common.change"),
          visuallyHiddenText: label,
        },
      ],
    },
    key: {
      text: label,
    },
    value,
    ...(visibleWhen === undefined ? {} : { visibleWhen }),
  };
}

/**
 * Creates the check-answers summary list.
 *
 * @returns The check-answers summary list.
 */
export function summaryList(): GovUKSummaryList {
  const dateOfSignature = summaryRow({
    href: "sign?returnTo=check-answers",
    label: answerLabelT("dateOfSignature"),
    value: { text: formatDate() },
  });
  const ufn = summaryRow({
    href: "ufn?returnTo=check-answers",
    label: answerLabelT("ufn"),
    value: { text: Answer(AnswerKey.DECLARATION_UFN) },
  });
  

  return GovUKSummaryList({
    rows: [
      dateOfSignature,
      ufn,
    ],
  });
}