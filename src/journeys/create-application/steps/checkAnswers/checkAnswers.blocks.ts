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

import { PriorLegalAid } from "#/api/clients/rcw/model/priorLegalAid.zod.gen.js";
import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import {
  formatAddressValue,
  formatChangeAddressRedirect,
  formatDateOfBirth,
  formatEcfLabel,
  formatLegalAidBeforeLabel,
  formatLegalAidLast6MonthsLabel,
} from "#/journeys/create-application/steps/checkAnswers/checkAnswers.formatters.js";
import { fixedT, t } from "#/lib/i18n.js";

const answerLabelT = fixedT(
  "journeys.createApplication.checkAnswers.answerLabels",
);

interface SummaryListOptions {
  showIncomplete?: boolean;
}

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
 * Creates the check-answers summary list.
 * @param options Summary list formatting options.
 *
 * @returns The check-answers summary list.
 */
export function summaryList(
  options: SummaryListOptions = {},
): GovUKSummaryList {
  const showIncomplete = options.showIncomplete ?? false;
  const ecf = summaryRow({
    href: "ecf?returnTo=check-answers",
    label: answerLabelT("ecf"),
    value: { text: formatEcfLabel(showIncomplete) },
  });
  const legalAidBefore = summaryRow({
    href: "legal-aid-before?returnTo=check-answers",
    label: answerLabelT("legalAidBefore"),
    value: { text: formatLegalAidBeforeLabel(showIncomplete) },
  });
  const legalAidLast6Months = summaryRow({
    href: "legal-aid-last-6-months?returnTo=check-answers",
    label: answerLabelT("legalAidLast6Months"),
    value: { text: formatLegalAidLast6MonthsLabel(showIncomplete) },
    visibleWhen: Answer(AnswerKey.legalAidBefore).match(
      Condition.Equals(PriorLegalAid.enum.yesSameMatter),
    ),
  });
  const reasonForYes = summaryRow({
    href: "legal-aid-last-6-months?returnTo=check-answers",
    label: answerLabelT("legalAidLast6MonthsReasonForYes"),
    value: { text: Answer(AnswerKey.reasonForYes) },
    visibleWhen: Answer(AnswerKey.legalAidLast6Months).match(
      Condition.Equals("yes"),
    ),
  });
  const firstName = summaryRow({
    href: "client-details?returnTo=check-answers",
    label: answerLabelT("firstName"),
    value: { text: Answer(AnswerKey.firstName) },
  });
  const lastName = summaryRow({
    href: "client-details?returnTo=check-answers",
    label: answerLabelT("lastName"),
    value: { text: Answer(AnswerKey.lastName) },
  });
  const dateOfBirth = summaryRow({
    href: "client-details?returnTo=check-answers",
    label: answerLabelT("dateOfBirth"),
    value: { text: formatDateOfBirth() },
  });
  const niNumber = summaryRow({
    href: "ni-number?returnTo=check-answers",
    label: answerLabelT("niNumber"),
    value: {
      text: match(Answer(AnswerKey.hasNINumber))
        .branch(Condition.Equals("yes"), Answer(AnswerKey.niNumber))
        .otherwise(t("common.no")),
    },
  });
  const haveAHomeAddress = summaryRow({
    href: "have-a-home-address?returnTo=check-answers",
    label: answerLabelT("haveAHomeAddress"),
    value: {
      text: match(Answer(AnswerKey.haveAHomeAddress))
        .branch(Condition.Equals("yes"), t("common.yes"))
        .otherwise(t("common.no")),
    },
  });
  const address = summaryRow({
    href: formatChangeAddressRedirect(),
    label: answerLabelT("address"),
    value: { html: formatAddressValue() },
  });

  return GovUKSummaryList({
    rows: [
      ecf,
      legalAidBefore,
      legalAidLast6Months,
      reasonForYes,
      firstName,
      lastName,
      dateOfBirth,
      niNumber,
      haveAHomeAddress,
      address,
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
  const { href, label, value, visibleWhen } = args;

  const row: SummaryRow = {
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
  };

  if (visibleWhen !== undefined) {
    row.visibleWhen = visibleWhen;
  }

  return row;
}
