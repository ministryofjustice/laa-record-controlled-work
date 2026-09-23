import {
  GovUKBody,
  GovUKCheckboxInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

/**
 * Renders the child care evidence group for the "Evidence of expenditure" step.
 * @returns {GovUKCheckboxInput} The child care evidence group component.
 */
export function childCareEvidenceGroup(): GovUKCheckboxInput {
  return GovUKCheckboxInput({
    code: "childCareEvidence",
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--m",
        isPageHeading: false,
        text: t(
          "journeys.evidence.evidenceOfExpenditure.groupsOfEvidence.childCare",
        ),
      },
    },
    items: [
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.bankStatementsChildCare",
        ),
        value: "bankStatementsChildCare",
      },
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.agreementOrContract",
        ),
        value: "agreementOrContract",
      },
    ],
  });
}

/**
 * Renders the housing costs evidence group for the "Evidence of expenditure" step.
 * @returns {GovUKCheckboxInput} The housing costs evidence group component.
 */
export function housingCostsEvidenceGroup(): GovUKCheckboxInput {
  return GovUKCheckboxInput({
    code: "housingCostsEvidence",
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--m",
        isPageHeading: false,
        text: t(
          "journeys.evidence.evidenceOfExpenditure.groupsOfEvidence.housingCosts",
        ),
      },
    },
    items: [
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.bankStatementsHousing",
        ),
        value: "bankStatementsHousing",
      },
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.mortgageStatement",
        ),
        value: "mortgageStatement",
      },
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.rentStatement",
        ),
        value: "rentStatement",
      },
    ],
  });
}

/**
 * Renders the income evidence group for the "Evidence of expenditure" step.
 * @returns {GovUKCheckboxInput} The income evidence group component.
 */
export function incomeEvidenceGroup(): GovUKCheckboxInput {
  return GovUKCheckboxInput({
    code: "incomeEvidence",
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--m",
        isPageHeading: false,
        text: t(
          "journeys.evidence.evidenceOfExpenditure.groupsOfEvidence.incomeTaxAndNationalInsurance",
        ),
      },
    },
    items: [
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.wageSlips",
        ),
        value: "wageSlips",
      },
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.taxCalculationSheet",
        ),
        value: "taxCalculationSheet",
      },
    ],
  });
}

/**
 * Renders the label for the "Evidence of expenditure" step.
 * @returns {GovUKBody} The label component.
 */
export function label(): GovUKBody {
  return GovUKBody({
    classes: "govuk-hint",
    text: t("journeys.evidence.evidenceOfExpenditure.hint"),
  });
}

/**
 * Renders the maintenance evidence group for the "Evidence of expenditure" step.
 * @returns {GovUKCheckboxInput} The maintenance evidence group component.
 */
export function maintenanceEvidenceGroup(): GovUKCheckboxInput {
  return GovUKCheckboxInput({
    code: "maintenanceEvidence",
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--m",
        isPageHeading: false,
        text: t(
          "journeys.evidence.evidenceOfExpenditure.groupsOfEvidence.maintenance",
        ),
      },
    },
    items: [
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.bankStatementsMaintenance",
        ),
        value: "bankStatementsMaintenance",
      },
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.maintenanceOrder",
        ),
        value: "maintenanceOrder",
      },
      {
        text: t(
          "journeys.evidence.evidenceOfExpenditure.evidenceTypes.receipts",
        ),
        value: "receipts",
      },
    ],
  });
}
