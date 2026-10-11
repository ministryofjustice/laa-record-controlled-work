import type {
  ResolvableBoolean,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

import {
  and,
  Answer,
  Condition,
  match,
  not,
  or,
  type PredicateExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKSummaryList } from "@ministryofjustice/hmpps-forge/govuk-components";

import { PriorLegalAid } from "#/api/clients/rcw/model/priorLegalAid.zod.gen.js";
import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import {
  formatAddressValue,
  formatChangeAddressRedirect,
  formatDateOfBirth,
  formatEcfLabel,
  formatFamilyLawClassificationLabel,
  formatIncompleteAnswerTag,
  formatLegalAidBeforeLabel,
  formatLegalAidLast6MonthsLabel,
  formatRequiredAnswer,
  formatSummaryText,
  formatYesNoAnswer,
} from "#/journeys/create-application/steps/checkAnswers/checkAnswers.formatters.js";
import { UK_ADDRESS_FIELDS } from "#/journeys/journey.constants.js";
import { fixedT, t } from "#/lib/i18n.js";

const answers = {
  t: fixedT("journeys.createApplication.checkAnswers.answerLabels"),
};

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
  displayAsIncomplete: ResolvableBoolean;
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
 *
 * @param options Summary list formatting options.
 * @param options.showIncomplete Render unavailable answers as incomplete.
 * @returns The check-answers summary list.
 */
export function summaryList(
  options: SummaryListOptions = {},
): GovUKSummaryList {
  const { showIncomplete = false } = options;

  const ecf = Answer(AnswerKey.ecf);
  const ecfRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      matchesNoneOf([
        ecf.match(Condition.Equals("yes")),
        ecf.match(Condition.Equals("no")),
      ]),
    ),
    href: "ecf?returnTo=check-answers",
    label: answers.t("ecf"),
    value: { text: formatEcfLabel(showIncomplete) },
  });

  const familyLawClassification = Answer(AnswerKey.familyLawClassification);
  const familyLawClassificationRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      matchesNoneOf([
        familyLawClassification.match(Condition.Equals("public")),
        familyLawClassification.match(Condition.Equals("private")),
      ]),
    ),
    href: "family-type-of-case?returnTo=check-answers",
    label: answers.t("familyLawClassification"),
    value: { text: formatFamilyLawClassificationLabel(showIncomplete) },
  });

  const legalAidBeforeRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      matchesNoneOf([
        Answer(AnswerKey.legalAidBefore).match(
          Condition.Equals(PriorLegalAid.enum.yesSameMatter),
        ),
        Answer(AnswerKey.legalAidBefore).match(
          Condition.Equals(PriorLegalAid.enum.yesDifferentMatter),
        ),
        Answer(AnswerKey.legalAidBefore).match(
          Condition.Equals(PriorLegalAid.enum.no),
        ),
      ]),
    ),
    href: "legal-aid-before?returnTo=check-answers",
    label: answers.t("legalAidBefore"),
    value: { text: formatLegalAidBeforeLabel(showIncomplete) },
  });

  const legalAidLast6MonthsRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      matchesNoneOf([
        Answer(AnswerKey.legalAidLast6Months).match(Condition.Equals("yes")),
        Answer(AnswerKey.legalAidLast6Months).match(Condition.Equals("no")),
      ]),
    ),
    href: "legal-aid-last-6-months?returnTo=check-answers",
    label: answers.t("legalAidLast6Months"),
    value: { text: formatLegalAidLast6MonthsLabel(showIncomplete) },
    visibleWhen: Answer(AnswerKey.legalAidBefore).match(
      Condition.Equals(PriorLegalAid.enum.yesSameMatter),
    ),
  });

  const reasonForYesRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      missingAnswer(AnswerKey.reasonForYes),
    ),
    href: "legal-aid-last-6-months?returnTo=check-answers",
    label: answers.t("legalAidLast6MonthsReasonForYes"),
    value: {
      text: formatRequiredAnswer(AnswerKey.reasonForYes, showIncomplete),
    },
    visibleWhen: showIncomplete
      ? and(
          Answer(AnswerKey.legalAidBefore).match(
            Condition.Equals(PriorLegalAid.enum.yesSameMatter),
          ),
          Answer(AnswerKey.legalAidLast6Months).match(Condition.Equals("yes")),
        )
      : Answer(AnswerKey.legalAidLast6Months).match(Condition.Equals("yes")),
  });

  const firstNameRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      missingAnswer(AnswerKey.firstName),
    ),
    href: "client-details?returnTo=check-answers",
    label: answers.t("firstName"),
    value: {
      text: formatRequiredAnswer(AnswerKey.firstName, showIncomplete),
    },
  });

  const lastNameRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      missingAnswer(AnswerKey.lastName),
    ),
    href: "client-details?returnTo=check-answers",
    label: answers.t("lastName"),
    value: {
      text: formatRequiredAnswer(AnswerKey.lastName, showIncomplete),
    },
  });

  const dateOfBirthRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      not(Answer(AnswerKey.dateOfBirth).match(Condition.Date.IsValid())),
    ),
    href: "client-details?returnTo=check-answers",
    label: answers.t("dateOfBirth"),
    value: { text: formatDateOfBirth(showIncomplete) },
  });

  const niNumberRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      match(Answer(AnswerKey.hasNINumber))
        .branch(Condition.Equals("yes"), missingAnswer(AnswerKey.niNumber))
        .branch(Condition.Equals("no"), false)
        .otherwise(true),
    ),
    href: "ni-number?returnTo=check-answers",
    label: answers.t("niNumber"),
    value: {
      text: match(Answer(AnswerKey.hasNINumber))
        .branch(
          Condition.Equals("yes"),
          formatRequiredAnswer(AnswerKey.niNumber, showIncomplete),
        )
        .branch(Condition.Equals("no"), t("common.no"))
        .otherwise(
          showIncomplete
            ? formatRequiredAnswer(AnswerKey.niNumber, true)
            : t("common.no"),
        ),
    },
  });

  const haveAHomeAddressRow = summaryRow({
    displayAsIncomplete: incompleteIf(
      showIncomplete,
      matchesNoneOf([
        Answer(AnswerKey.haveAHomeAddress).match(Condition.Equals("yes")),
        Answer(AnswerKey.haveAHomeAddress).match(Condition.Equals("no")),
      ]),
    ),
    href: "have-a-home-address?returnTo=check-answers",
    label: answers.t("haveAHomeAddress"),
    value: {
      text: formatYesNoAnswer(AnswerKey.haveAHomeAddress, showIncomplete),
    },
  });

  const addressRow = summaryRow({
    displayAsIncomplete: incompleteIf(showIncomplete, addressIsIncomplete()),
    href: formatChangeAddressRedirect(),
    label: answers.t("address"),
    value: { html: formatAddressValue(showIncomplete) },
  });

  return GovUKSummaryList({
    rows: [
      ecfRow,
      familyLawClassificationRow,
      legalAidBeforeRow,
      legalAidLast6MonthsRow,
      reasonForYesRow,
      firstNameRow,
      lastNameRow,
      dateOfBirthRow,
      niNumberRow,
      haveAHomeAddressRow,
      addressRow,
    ],
  });
}

/**
 * Determines whether the active address lacks its required first line.
 * @returns Whether the address summary should be incomplete.
 */
function addressIsIncomplete(): ResolvableBoolean {
  return match(Answer(AnswerKey.haveAHomeAddress))
    .branch(
      Condition.Equals("yes"),
      match(Answer(UK_ADDRESS_FIELDS.country))
        .branch(
          Condition.Equals("United Kingdom"),
          missingAnswer(AnswerKey.ukAddressLine1),
        )
        .otherwise(missingAnswer(AnswerKey.osAddressLine1)),
    )
    .branch(Condition.Equals("no"), false)
    .otherwise(true);
}

/**
 * Applies an incomplete condition only to edit summaries.
 * @param showIncomplete Whether edit formatting is enabled.
 * @param condition The condition that identifies an incomplete value.
 * @returns The condition for an edit summary, if enabled.
 */
function incompleteIf(
  showIncomplete: boolean,
  condition: ResolvableBoolean,
): ResolvableBoolean {
  return showIncomplete ? condition : false;
}

/**
 * Determines whether none of the supplied conditions match.
 * @param conditions The conditions to test.
 * @returns Whether no condition matches.
 */
function matchesNoneOf(conditions: PredicateExpr[]): ResolvableBoolean {
  return not(or(conditions));
}

/**
 * Determines whether a required answer is missing.
 * @param answerKey The required answer key.
 * @returns Whether the answer is missing.
 */
function missingAnswer(answerKey: AnswerKey): ResolvableBoolean {
  return not(Answer(answerKey).match(Condition.IsRequired()));
}

/**
 * Creates a summary row with a GOV.UK change action.
 *
 * @param args Summary row configuration.
 * @returns A configured summary row.
 */
function summaryRow(args: SummaryRowArgs): SummaryRow {
  const { displayAsIncomplete, href, label, value, visibleWhen } = args;

  let summaryValue: SummaryRow["value"] = value;
  if (displayAsIncomplete !== false) {
    summaryValue = {
      ...value,
      html: match(displayAsIncomplete)
        .branch(Condition.Equals(true), formatIncompleteAnswerTag())
        .otherwise(value.html ?? formatSummaryText(value.text ?? "")),
    };
  }

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
    value: summaryValue,
    ...(visibleWhen === undefined ? {} : { visibleWhen }),
  };
}
