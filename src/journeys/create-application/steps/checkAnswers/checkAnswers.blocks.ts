import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Answer,
  Condition,
  match,
  not,
  type PredicateExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import {
  GovUKSummaryList,
  GovUKTag,
  type SummaryListRow,
  type SummaryListValue,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import {
  formatAddressValue,
  formatChangeAddressRedirect,
  formatDateOfBirth,
  formatEcfLabel,
  formatFamilyLawClassificationLabel,
  formatInternationalMaintenanceAgreementLabel,
  formatLaspoEvidenceScopeLabel,
  formatLegalAidBeforeLabel,
  formatLegalAidLast6MonthsLabel,
  formatLetterFromLocalAuthority,
  formatNeedsProtectiveInjunctionLabel,
} from "#/journeys/create-application/steps/checkAnswers/checkAnswers.formatters.js";
import { fixedT, t } from "#/lib/i18n.js";

import { checkAnswersModel } from "./checkAnswers.model.js";

const answerLabelT = fixedT(
  "journeys.createApplication.checkAnswers.answerLabels",
);

interface SummaryRow {
  href: ResolvableString;
  label: ResolvableString;
  value: SummaryListValue;
}

/**
 * Creates the edit summary with tags for incomplete answers.
 * @returns The editable check-answers summary list.
 */
export function editSummaryListBlock(): GovUKSummaryList {
  return createSummaryList(createConditionalSummaryValue);
}

/**
 * Creates the summary list for the completed create journey.
 * @returns The check-answers summary list.
 */
export function summaryList(): GovUKSummaryList {
  return createSummaryList((value) => value);
}

/**
 * Builds the summary value displayed while answers are incomplete.
 *
 * @param value The original summary value.
 * @param completed The condition that determines whether answers are complete.
 * @returns A summary value with completion and incomplete states.
 */
function createConditionalSummaryValue(
  value: SummaryListValue,
  completed: PredicateExpr,
): SummaryListValue {
  const html =
    value.html ??
    NunjucksGenerators.String({
      data: { text: value.text },
      template: "{{ text }}",
    });

  return {
    blocks: [
      HtmlBlock({ content: html, visibleWhen: completed }),
      GovUKTag({
        classes: "govuk-tag--blue",
        text: t("journeys.createApplication.checkAnswers.incomplete"),
        visibleWhen: not(completed),
      }),
    ],
  };
}

/**
 * Joins presentation definitions with the summary field rules.
 * @param formatValue The presentation of each field's completion state.
 * @returns The configured summary list.
 */
function createSummaryList(
  formatValue: (
    value: SummaryListValue,
    completed: PredicateExpr,
  ) => SummaryListValue,
): GovUKSummaryList {
  const model = checkAnswersModel();
  const rows = [
    {
      field: AnswerKey.ecf,
      href: "ecf?returnTo=check-answers",
      label: answerLabelT("ecf"),
      value: { text: formatEcfLabel() },
    },
    {
      field: AnswerKey.familyLawClassification,
      href: "family-type-of-case?returnTo=check-answers",
      label: answerLabelT("familyLawClassification"),
      value: { text: formatFamilyLawClassificationLabel() },
    },
    {
      field: AnswerKey.needsAdviceOnEUOrInternationalMaintenance,
      href: "international-maintenance-agreement?returnTo=check-answers",
      label: answerLabelT("internationalMaintenanceAgreement"),
      value: { text: formatInternationalMaintenanceAgreementLabel() },
    },
    {
      field: AnswerKey.careProceedingsStarted,
      href: "care-proceedings?returnTo=check-answers",
      label: answerLabelT("letterFromLocalAuthority"),
      value: { text: formatLetterFromLocalAuthority() },
    },
    {
      field: AnswerKey.needsProtectiveInjunction,
      href: "protect-themself?returnTo=check-answers",
      label: answerLabelT("protectThemselves"),
      value: { text: formatNeedsProtectiveInjunctionLabel() },
    },
    {
      field: AnswerKey.laspoEvidenceScope,
      href: "prove-in-scope?returnTo=check-answers",
      label: answerLabelT("laspoEvidenceScope"),
      value: { text: formatLaspoEvidenceScopeLabel() },
    },
    {
      field: AnswerKey.legalAidBefore,
      href: "legal-aid-before?returnTo=check-answers",
      label: answerLabelT("legalAidBefore"),
      value: { text: formatLegalAidBeforeLabel() },
    },
    {
      field: AnswerKey.legalAidLast6Months,
      href: "legal-aid-last-6-months?returnTo=check-answers",
      label: answerLabelT("legalAidLast6Months"),
      value: { text: formatLegalAidLast6MonthsLabel() },
    },
    {
      field: AnswerKey.reasonForYes,
      href: "legal-aid-last-6-months?returnTo=check-answers",
      label: answerLabelT("legalAidLast6MonthsReasonForYes"),
      value: { text: Answer(AnswerKey.reasonForYes) },
    },
    {
      field: AnswerKey.firstName,
      href: "client-details?returnTo=check-answers",
      label: answerLabelT("firstName"),
      value: { text: Answer(AnswerKey.firstName) },
    },
    {
      field: AnswerKey.lastName,
      href: "client-details?returnTo=check-answers",
      label: answerLabelT("lastName"),
      value: { text: Answer(AnswerKey.lastName) },
    },
    {
      field: AnswerKey.dateOfBirth,
      href: "client-details?returnTo=check-answers",
      label: answerLabelT("dateOfBirth"),
      value: { text: formatDateOfBirth() },
    },
    {
      field: AnswerKey.niNumber,
      href: "ni-number?returnTo=check-answers",
      label: answerLabelT("niNumber"),
      value: {
        text: match(Answer(AnswerKey.hasNINumber))
          .branch(Condition.Equals("yes"), Answer(AnswerKey.niNumber))
          .otherwise(t("common.no")),
      },
    },
    {
      field: AnswerKey.haveAHomeAddress,
      href: "have-a-home-address?returnTo=check-answers",
      label: answerLabelT("haveAHomeAddress"),
      value: {
        text: match(Answer(AnswerKey.haveAHomeAddress))
          .branch(Condition.Equals("yes"), t("common.yes"))
          .otherwise(t("common.no")),
      },
    },
    {
      field: "address",
      href: formatChangeAddressRedirect(),
      label: answerLabelT("address"),
      value: { html: formatAddressValue() },
    },
  ] satisfies Array<SummaryRow & { field: keyof typeof model }>;

  return GovUKSummaryList({
    rows: rows.map(({ field, href, label, value }): SummaryListRow => {
      const { completeWhen, visibleWhen } = model[field];

      return {
        actions: {
          items: [
            { href, text: t("common.change"), visuallyHiddenText: label },
          ],
        },
        key: { text: label },
        value: formatValue(value, completeWhen),
        visibleWhen,
      };
    }),
  });
}
