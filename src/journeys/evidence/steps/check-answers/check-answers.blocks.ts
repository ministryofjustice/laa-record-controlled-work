import {
  Answer,
  Condition,
  Format,
  Params,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKHeading,
  GovUKSummaryList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

import {
  doYouHaveEvidenceLabel,
  evidenceOfCapitalList,
  evidenceOfExpenditureList,
  evidenceOfIncomeList,
  hasCapitalEvidenceLabel,
  hasExpenditureEvidenceLabel,
  mergedReasonForNoEvidenceLabel,
} from "./check-answers.formatters.js";

export const heading = GovUKHeading({
  text: t("journeys.evidence.checkAnswers.title"),
});

export const summaryList = GovUKSummaryList({
  rows: [
    {
      actions: {
        items: [
          {
            href: Format(
              "/cases/%1/evidence/have-evidence?returnTo=check-answers",
              Params(PARAMS_KEYS.applicationID),
            ),
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.doYouHaveEvidence",
            ),
          },
        ],
      },
      key: {
        text: t(
          "journeys.evidence.checkAnswers.answerLabels.doYouHaveEvidence",
        ),
      },
      value: { text: doYouHaveEvidenceLabel() },
    },
    {
      actions: {
        items: [
          {
            href: Format(
              "/cases/%1/evidence/reason-for-no-evidence?returnTo=check-answers",
              Params(PARAMS_KEYS.applicationID),
            ),
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.reasonForNoEvidence",
            ),
          },
        ],
      },
      key: {
        text: t(
          "journeys.evidence.checkAnswers.answerLabels.reasonForNoEvidence",
        ),
      },
      value: { html: mergedReasonForNoEvidenceLabel() },
      visibleWhen: Answer("doYouHaveEvidence").match(Condition.Equals("no")),
    },
    {
      actions: {
        items: [
          {
            href: Format(
              "/cases/%1/evidence/evidence-of-income?returnTo=check-answers",
              Params(PARAMS_KEYS.applicationID),
            ),
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.evidenceOfIncome",
            ),
          },
        ],
      },
      key: {
        text: t("journeys.evidence.checkAnswers.answerLabels.evidenceOfIncome"),
      },
      value: { html: evidenceOfIncomeList() },
      visibleWhen: Answer("doYouHaveEvidence").match(Condition.Equals("yes")),
    },
    {
      actions: {
        items: [
          {
            href: Format(
              "/cases/%1/evidence/have-evidence-of-expenditure?returnTo=check-answers",
              Params(PARAMS_KEYS.applicationID),
            ),
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.haveEvidenceOfExpenditure",
            ),
          },
        ],
      },
      key: {
        text: t(
          "journeys.evidence.checkAnswers.answerLabels.haveEvidenceOfExpenditure",
        ),
      },
      value: { text: hasExpenditureEvidenceLabel() },
      visibleWhen: Answer("doYouHaveEvidence").match(Condition.Equals("yes")),
    },
    {
      actions: {
        items: [
          {
            href: Format(
              "/cases/%1/evidence/evidence-of-expenditure?returnTo=check-answers",
              Params(PARAMS_KEYS.applicationID),
            ),
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.evidenceOfExpenditure",
            ),
          },
        ],
      },
      key: {
        text: t(
          "journeys.evidence.checkAnswers.answerLabels.evidenceOfExpenditure",
        ),
      },
      value: { html: evidenceOfExpenditureList() },
      visibleWhen: Answer("haveEvidenceOfExpenditure").match(
        Condition.Equals("yes"),
      ),
    },
    {
      actions: {
        items: [
          {
            href: Format(
              "/cases/%1/evidence/have-evidence-of-capital?returnTo=check-answers",
              Params(PARAMS_KEYS.applicationID),
            ),
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.haveEvidenceOfCapital",
            ),
          },
        ],
      },
      key: {
        text: t(
          "journeys.evidence.checkAnswers.answerLabels.haveEvidenceOfCapital",
        ),
      },
      value: { text: hasCapitalEvidenceLabel() },
      visibleWhen: Answer("doYouHaveEvidence").match(Condition.Equals("yes")),
    },
    {
      actions: {
        items: [
          {
            href: Format(
              "/cases/%1/evidence/evidence-of-capital?returnTo=check-answers",
              Params(PARAMS_KEYS.applicationID),
            ),
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.evidenceOfCapital",
            ),
          },
        ],
      },
      key: {
        text: t(
          "journeys.evidence.checkAnswers.answerLabels.evidenceOfCapital",
        ),
      },
      value: { html: evidenceOfCapitalList() },
      visibleWhen: Answer("haveEvidenceOfCapital").match(
        Condition.Equals("yes"),
      ),
    },
  ],
});
