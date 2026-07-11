import {
  GovUKBody,
  GovUKCheckboxInput,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

export const heading = GovUKHeading({
  level: H1,
  text: t("journeys.evidence.evidenceOfIncome.title"),
});

export const description = GovUKBody({
  classes: "govuk-hint",
  text: t("journeys.evidence.evidenceOfIncome.hint"),
});

export const employedEvidenceGroup = GovUKCheckboxInput({
  code: "incomeEvidenceTypes",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--m",
      isPageHeading: false,
      text: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.employedPAYE",
      ),
    },
  },
  items: [
    {
      text: t("journeys.evidence.evidenceOfIncome.evidenceTypes.wageSlips"),
      value: "wageSlips",
    },
  ],
});

export const selfEmployedEvidenceGroup = GovUKCheckboxInput({
  code: "incomeEvidenceTypes",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--m",
      isPageHeading: false,
      text: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.selfEmployed",
      ),
    },
  },
  items: [
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.bankStatements",
      ),
      value: "bankStatements",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.completeFinancialAccounts",
      ),
      value: "completeFinancialAccounts",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.selfAssessmentTaxReturn",
      ),
      value: "selfAssessmentTaxReturn",
    },
    {
      text: t("journeys.evidence.evidenceOfIncome.evidenceTypes.cashBook"),
      value: "cashBook",
    },
  ],
});

export const benefitsInKindEvidenceGroup = GovUKCheckboxInput({
  code: "incomeEvidenceTypes",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--m",
      isPageHeading: false,
      text: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.benefitsInKind",
      ),
    },
  },
  items: [
    {
      text: t("journeys.evidence.evidenceOfIncome.evidenceTypes.p11dTaxForm"),
      value: "p11dTaxForm",
    },
  ],
});

export const otherEvidenceGroup = GovUKCheckboxInput({
  code: "incomeEvidenceTypes",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--m",
      isPageHeading: false,
      text: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.otherIncome",
      ),
    },
  },
  items: [
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.evidenceOfRentalIncome",
      ),
      value: "evidenceOfRentalIncome",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.evidenceOfTrustIncome",
      ),
      value: "evidenceOfTrustIncome",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.letterFromFriendOrFamily",
      ),
      value: "letterFromFriendOrFamily",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.pensionDocuments",
      ),
      value: "pensionDocuments",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.studentLoanLetter",
      ),
      value: "studentLoanLetter",
    },
    {
      text: t("journeys.evidence.evidenceOfIncome.evidenceTypes.other"),
      value: "other",
    },
  ],
});

export const stateBenefitsEvidenceGroup = GovUKCheckboxInput({
  code: "incomeEvidenceTypes",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--m",
      isPageHeading: false,
      text: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.stateBenefits",
      ),
    },
  },
  items: [
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.latestBenefitChangeLetter",
      ),
      value: "latestBenefitChangeLetter",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.passportingBenefitLetter",
      ),
      value: "passportingBenefitLetter",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.originalNotificationLetter",
      ),
      value: "originalNotificationLetter",
    },
  ],
});

export const asylumSupportEvidenceGroup = GovUKCheckboxInput({
  code: "incomeEvidenceTypes",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--m",
      isPageHeading: false,
      text: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.asylumSupport",
      ),
    },
  },
  items: [
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.asylumSupportLetter",
      ),
      value: "asylumSupportLetter",
    },
  ],
});

export const taxCreditsEvidenceGroup = GovUKCheckboxInput({
  code: "incomeEvidenceTypes",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--m",
      isPageHeading: false,
      text: t("journeys.evidence.evidenceOfIncome.groupsOfEvidence.taxCredits"),
    },
  },
  items: [
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.latestTaxCreditAwardNotice",
      ),
      value: "latestTaxCreditAwardNotice",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.otherRecentHMRCLetter",
      ),
      value: "otherRecentHMRCLetter",
    },
  ],
});
