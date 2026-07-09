import { t } from "#/lib/i18n.js";
import { GovUKCheckboxInput } from "@ministryofjustice/hmpps-forge/govuk-components";

export const evidenceOfIncomeTypes = GovUKCheckboxInput({
  code: "evidenceOfIncomeTypes",
  hint: {
    text: t("journeys.evidence.evidenceOfIncome.hint"),
  },
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--l",
      isPageHeading: true,
      text: t("journeys.evidence.evidenceOfIncome.title"),
    },
  },
  items: [
    {
      divider: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.employedPAYE",
      ),
    },
    {
      text: t("journeys.evidence.evidenceOfIncome.evidenceTypes.wageSlips"),
      value: "wageSlips",
    },
    {
      divider: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.selfEmployed",
      ),
    },
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
    {
      divider: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.benefitsInKind",
      ),
    },
    {
      text: t("journeys.evidence.evidenceOfIncome.evidenceTypes.p11dTaxForm"),
      value: "p11dTaxForm",
    },
    {
      divider: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.otherIncome",
      ),
    },
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
    {
      divider: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.stateBenefits",
      ),
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.bankStatements",
      ),
      value: "bankStatements",
    },
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
    {
      divider: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.asylumSupport",
      ),
      attributes: { class: "govuk-heading-m" },
    },
    {
      text: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.asylumSupportLetter",
      ),
      value: "asylumSupportLetter",
    },
    {
      divider: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.taxCredits",
      ),
    },
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
