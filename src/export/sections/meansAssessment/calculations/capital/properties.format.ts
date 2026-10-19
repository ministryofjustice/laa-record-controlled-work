import type { CfeProperty } from "#/export/sections/meansAssessment/calculations/capital/properties.zod.js";
import type { MeansAssessmentCalculationRow } from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { CFE_MAX_VALUE } from "#/export/sections/meansAssessment/calculations/calculations.constants.js";
import { negate } from "#/export/sections/meansAssessment/calculations/calculations.helpers.js";
import { formatGBP } from "#/lib/currency.js";
import { fixedT } from "#/lib/i18n.js";

const capital = {
  t: fixedT("pages.export.meansAssessment.calculations.capital"),
};
const means = { t: fixedT("pages.export.meansAssessment") };
const ZERO_AMOUNT = 0;

const PropertyField = {
  MainHomeDisregard: "mainHomeDisregard",
  Mortgage: "mortgage",
  SmodAllowance: "smodAllowance",
  TransactionAllowance: "transactionAllowance",
  Value: "value",
} as const;

export type PropertyField = (typeof PropertyField)[keyof typeof PropertyField];

const PROPERTY_FIELDS: PropertyField[] = [
  PropertyField.Value,
  PropertyField.Mortgage,
  PropertyField.TransactionAllowance,
  PropertyField.SmodAllowance,
  PropertyField.MainHomeDisregard,
];

/**
 * Identifies a saved nonzero Subject Matter of Dispute (SMOD) allowance for layout selection.
 * @param property Saved CFE property amounts.
 * @returns Whether the saved Subject Matter of Dispute allowance is nonzero.
 */
export function hasSubjectMatterOfDisputeAllowance(
  property: CfeProperty,
): boolean {
  const amount = property.smod_allowance;
  return (
    amount !== null &&
    amount !== undefined &&
    amount !== ZERO_AMOUNT &&
    amount !== CFE_MAX_VALUE
  );
}

/**
 * Prepares the saved assessed-equity row and optional ownership hint.
 * @param property Saved CFE property amounts.
 * @param hint Optional ownership-share wording.
 * @returns The emphasized assessed-value row.
 */
export function toAssessedEquityRow(
  property: CfeProperty,
  hint: null | string,
): MeansAssessmentCalculationRow {
  return {
    amount: formatPropertyCurrency(property.assessed_equity),
    emphasis: true,
    heading: capital.t("rows.assessedValue"),
    hint,
  };
}

/**
 * Prepares CCQ's percentage-bearing net-equity row from saved values.
 * @param property Saved CFE property amounts.
 * @returns The saved net-equity row.
 */
export function toNetEquityRow(
  property: CfeProperty,
): MeansAssessmentCalculationRow {
  return {
    amount: formatPropertyCurrency(property.net_equity),
    heading: capital.t("rows.netEquity", {
      percentage: Math.round(property.percentage_owned),
    }),
    hint: null,
  };
}

/**
 * Formats the owner-specific hint used by minimal partial-property tables.
 * @param person Property owner.
 * @param property Saved CFE ownership percentage.
 * @returns Translated ownership-share wording.
 */
export function toPartialOwnershipHint(
  person: "client" | "partner",
  property: CfeProperty,
): string {
  const adult = person === "client" ? "Client" : "Partner";
  return capital.t(`rows.partial${adult}Hint`, {
    percentage: Math.round(property.percentage_owned),
  });
}

/**
 * Maps property fields in CCQ order and suppresses only saved zeros.
 * CCQ: laa-check-client-qualifies/app/models/calculation_result.rb#property_data.
 * @param property Saved CFE property amounts.
 * @param isAdditional Whether the value label uses additional-property copy.
 * @param propertyFields Field keys for a selected ownership layout.
 * @returns Formatted property rows.
 */
export function toPropertyRows(
  property: CfeProperty,
  isAdditional: boolean,
  propertyFields: PropertyField[] = PROPERTY_FIELDS,
): MeansAssessmentCalculationRow[] {
  return propertyFields.flatMap((propertyField) => {
    const amount = propertyAmount(property, propertyField);
    if (amount === ZERO_AMOUNT) {
      return [];
    }
    return [
      {
        amount: formatPropertyCurrency(amount),
        heading: propertyLabel(propertyField, isAdditional, property),
        hint: propertyHint(propertyField),
      },
    ];
  });
}

/**
 * Formats a saved amount with detailed-calculation missing-value semantics.
 * @param amount Saved amount, if present.
 * @returns Formatted amount or translated not-applicable value.
 */
function formatPropertyCurrency(amount: null | number | undefined): string {
  if (amount === null || amount === undefined || amount === CFE_MAX_VALUE) {
    return means.t("calculations.notApplicable");
  }
  return formatGBP(amount);
}

/**
 * Selects the saved value or negates a saved deduction for display.
 * @param property Saved CFE property amounts.
 * @param propertyField Property field being presented.
 * @returns The saved amount with CCQ's deduction sign, if applicable.
 */
function propertyAmount(
  property: CfeProperty,
  propertyField: PropertyField,
): null | number | undefined {
  switch (propertyField) {
    case PropertyField.MainHomeDisregard:
      return negate(property.main_home_equity_disregard);
    case PropertyField.Mortgage:
      return negate(property.outstanding_mortgage);
    case PropertyField.SmodAllowance:
      return negate(property.smod_allowance);
    case PropertyField.TransactionAllowance:
      return negate(property.transaction_allowance);
    case PropertyField.Value:
      return property.value;
  }
}

/**
 * Selects CCQ's copied hint for one property field.
 * The transaction allowance hint is explanatory text, not a calculation.
 * Source: laa-check-client-qualifies/app/views/results/_property_table.html.slim;
 * config/locales/en.yml#results.show.property_rows.
 * Recheck copied wording when CCQ's policy text changes.
 * @param propertyField Property field being presented.
 * @returns A translated hint, or null when this field has none.
 */
function propertyHint(propertyField: PropertyField): null | string {
  if (
    propertyField === PropertyField.TransactionAllowance ||
    propertyField === PropertyField.MainHomeDisregard
  ) {
    return capital.t(`hints.${propertyField}`);
  }
  return null;
}

/**
 * Selects CCQ's alternative value and Subject Matter of Dispute (SMOD) labels.
 * Source: laa-check-client-qualifies/app/views/results/_property_table.html.slim.
 * @param propertyField Property field being presented.
 * @param isAdditional Whether the property is additional.
 * @param property Saved CFE property amounts.
 * @returns The translated row label.
 */
function propertyLabel(
  propertyField: PropertyField,
  isAdditional: boolean,
  property: CfeProperty,
): string {
  if (propertyField === PropertyField.Value) {
    return capital.t(isAdditional ? "rows.additionalValue" : "rows.value");
  }
  if (
    propertyField === PropertyField.MainHomeDisregard &&
    propertyAmount(property, PropertyField.SmodAllowance) !== ZERO_AMOUNT
  ) {
    return capital.t("rows.otherDisregards");
  }
  return capital.t(`rows.${propertyField}`);
}
