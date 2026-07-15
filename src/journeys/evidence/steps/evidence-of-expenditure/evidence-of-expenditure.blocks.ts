import {
  GovUKBody,
  GovUKCheckboxInput,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

export const heading = GovUKHeading({
  level: H1,
  text: t("journeys.evidence.evidenceOfExpenditure.title"),
});

export const description = GovUKBody({
  classes: "govuk-hint",
  text:
    `${t("journeys.evidence.evidenceOfExpenditure.description")} ` +
    `<a href="https://laa-means-match-prototype.apps.live.cloud-platform.service.justice.gov.uk/MVP/evidence-expenditure#" target="_blank">${t("journeys.evidence.evidenceOfExpenditure.linkText")}</a>`,
});

export const label = GovUKBody({
  classes: "govuk-hint",
  text: t("journeys.evidence.evidenceOfExpenditure.hint"),
});

export const employedEvidenceGroup = GovUKCheckboxInput({
  code: "employedEvidence",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--m",
      isPageHeading: false,
      text: t(
        "journeys.evidence.evidenceOfExpenditure.groupsOfEvidence.incomeFromEmployment",
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

export const housingCostsEvidenceGroup = GovUKCheckboxInput({
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

export const childCareEvidenceGroup = GovUKCheckboxInput({
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

export const maintenanceEvidenceGroup = GovUKCheckboxInput({
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
      text: t("journeys.evidence.evidenceOfExpenditure.evidenceTypes.receipts"),
      value: "receipts",
    },
  ],
});
