import type {
  ClientCapitalSummary,
  PartnerCapitalSummary,
} from "#/export/sections/meansAssessment/calculations/capital/disposableCapital.zod.js";
import type {
  MeansAssessmentCalculationRow,
  MeansAssessmentCalculationTable,
} from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { CFE_MAX_VALUE } from "#/export/sections/meansAssessment/calculations/calculations.constants.js";
import {
  floorCombinedAssessedCapital,
  negate,
} from "#/export/sections/meansAssessment/calculations/calculations.helpers.js";
import { formatGBP } from "#/lib/currency.js";
import { fixedT } from "#/lib/i18n.js";

const means = { t: fixedT("pages.export.meansAssessment") };
const capital = {
  t: fixedT("pages.export.meansAssessment.calculations.capital"),
};
const ZERO_AMOUNT = 0;

// Static disregard limits are explanatory copy, never applied to saved amounts.
// CCQ: config/locales/en.yml#results.show.client_capital_subtotal_types and #results.show.pensioner_disregard_caption.
// Recheck the wording and figures when CCQ policy text changes.

interface DisposableCapitalOptions {
  client: ClientCapitalSummary;
  hasPartner: boolean;
  partner: null | PartnerCapitalSummary;
  upperThreshold: number;
}

/**
 * Prepares CCQ's adult capital tables, pensioner display sum, and final total.
 * @param options Validated saved capital values and result-based partner state.
 * @param options.client Saved client capital amounts.
 * @param options.hasPartner Whether saved assessment capital contains a partner.
 * @param options.partner Saved partner capital amounts, when present.
 * @param options.upperThreshold Minimum saved capital proceeding threshold.
 * @returns Ordered disposable-capital tables after property tables.
 */
export function toDisposableCapitalTables({
  client,
  hasPartner,
  partner,
  upperThreshold,
}: DisposableCapitalOptions): MeansAssessmentCalculationTable[] {
  const hasDispute = client.subject_matter_of_dispute_disregard > ZERO_AMOUNT;
  const tables = [toClientTable(client, hasPartner, hasDispute)];

  if (hasPartner && partner !== null) {
    tables.push(toPartnerTable(partner));
    if (hasPensionerDisregard(client, partner)) {
      tables.push(toPensionerTable(client, partner));
    }
  }

  tables.push(toFinalCapitalTable(client, upperThreshold));
  return tables;
}

/**
 * Formats a saved detailed amount using CFE's missing-value display.
 * @param amount Saved amount, if present.
 * @returns Two-decimal GBP or Not applicable.
 */
function formatCapitalCurrency(amount: null | number | undefined): string {
  if (amount === null || amount === undefined || amount === CFE_MAX_VALUE) {
    return means.t("calculations.notApplicable");
  }
  return formatGBP(amount);
}

/**
 * Checks whether either person has a positive saved pensioner disregard.
 * A pensioner disregard is capital excluded from the means assessment.
 * CCQ's app/views/results/_capital_table.html.slim shows the separate disregard
 * table only when a partner is present and either person's disregard is positive.
 * The caller checks for a partner; this helper checks both saved amounts.
 * @param client Saved client pensioner disregard.
 * @param partner Saved partner pensioner disregard.
 * @returns Whether either saved adult disregard is positive.
 */
function hasPensionerDisregard(
  client: ClientCapitalSummary,
  partner: PartnerCapitalSummary,
): boolean {
  return [
    client.pensioner_disregard_applied,
    partner.pensioner_disregard_applied,
  ].some(
    (amount) => amount !== null && amount !== undefined && amount > ZERO_AMOUNT,
  );
}

/**
 * Adds only present saved operands, preserving unavailable values and sentinels.
 * @param first First saved amount.
 * @param second Second saved amount.
 * @returns Their display sum, or a missing-value marker.
 */
function sumSavedAmounts(
  first: null | number | undefined,
  second: null | number | undefined,
): null | number {
  if (
    first === null ||
    first === undefined ||
    second === null ||
    second === undefined
  ) {
    return null;
  }
  if (first === CFE_MAX_VALUE || second === CFE_MAX_VALUE) {
    return CFE_MAX_VALUE;
  }
  return first + second;
}

/**
 * Prepares one translated capital row with saved amount formatting.
 * @param key Capital row label key.
 * @param amount Saved amount after any approved display sign or sum.
 * @param hint Optional copied explanation.
 * @param emphasis Whether CCQ emphasizes the row.
 * @returns A prepared calculation row.
 */
function toCapitalRow(
  key: string,
  amount: null | number | undefined,
  hint: null | string = null,
  emphasis = false,
): MeansAssessmentCalculationRow {
  return {
    amount: formatCapitalCurrency(amount),
    emphasis,
    heading: capital.t(`rows.${key}`),
    hint,
  };
}

/**
 * Maps CCQ's client rows and client-only subtotals.
 * CCQ: laa-check-client-qualifies/app/models/cfe_result.rb#capital_row_items and #client_capital_subtotal_rows;
 * app/views/results/_disposable_capital_table.html.slim.
 * @param client Saved client capital summary.
 * @param hasPartner Whether saved assessment capital contains a partner.
 * @param hasDispute Whether saved SMOD selects alternative disregard hints.
 * @returns The client table with saved subtotals and optional assessed capital.
 */
function toClientTable(
  client: ClientCapitalSummary,
  hasPartner: boolean,
  hasDispute: boolean,
): MeansAssessmentCalculationTable {
  const rows = [
    toCapitalRow("property", client.total_property),
    toCapitalRow("liquid", client.total_liquid),
    toCapitalRow("nonLiquid", client.total_non_liquid),
    toCapitalRow("totalCapital", client.total_capital),
    toCapitalRow(
      "smodNonPropertyDisregard",
      negate(client.disputed_non_property_disregard),
      capital.t(hasDispute ? "hints.smodDisregardAlt" : "hints.smodDisregard"),
    ),
    toCapitalRow(
      "pensionerDisregard",
      negate(client.pensioner_disregard_applied),
      capital.t(
        hasDispute ? "hints.pensionerDisregardAlt" : "hints.pensionerDisregard",
      ),
    ),
  ];

  if (hasPartner) {
    // CCQ: CfeResult#raw_client_assessed_capital reads this saved adult total.
    rows.push(
      toCapitalRow(
        "disposableCapital",
        client.total_capital_with_smod,
        null,
        true,
      ),
    );
  }

  return {
    heading: capital.t("tables.clientDisposableCapital"),
    hint: null,
    rows,
  };
}

/**
 * Maps the repeated total and minimum saved capital limit.
 * @param client Saved client capital summary.
 * @param upperThreshold Minimum saved proceeding threshold.
 * @returns CCQ's final total table.
 */
function toFinalCapitalTable(
  client: ClientCapitalSummary,
  upperThreshold: number,
): MeansAssessmentCalculationTable {
  return {
    heading: capital.t("tables.total"),
    hint: null,
    rows: [
      toCapitalRow(
        "combinedAssessedCapital",
        floorCombinedAssessedCapital(client.combined_assessed_capital),
        null,
        true,
      ),
      toCapitalRow("upperThreshold", upperThreshold),
    ],
  };
}

/**
 * Maps CCQ's partner rows without adding client-only subtotals.
 * @param partner Saved partner capital summary.
 * @returns The partner capital table with saved disposable capital.
 */
function toPartnerTable(
  partner: PartnerCapitalSummary,
): MeansAssessmentCalculationTable {
  return {
    heading: capital.t("tables.partnerDisposableCapital"),
    hint: null,
    rows: [
      toCapitalRow("property", partner.total_property),
      toCapitalRow("liquid", partner.total_liquid),
      toCapitalRow("nonLiquid", partner.total_non_liquid),
      // Use the partner's saved disposable capital, not the combined total.
      // Matches Check Client Qualifies (CCQ): CfeResult#raw_partner_assessed_capital
      // reads result_summary.partner_capital.total_capital_with_smod directly.
      toCapitalRow(
        "disposableCapital",
        partner.total_capital_with_smod,
        null,
        true,
      ),
    ],
  };
}

/**
 * Maps CCQ's pensioner table using only its two approved saved-value sums.
 * CCQ: laa-check-client-qualifies/app/models/cfe_result.rb#pensioner_disregard_rows;
 * app/views/results/_capital_table.html.slim.
 * @param client Saved client capital summary.
 * @param partner Saved partner capital summary.
 * @returns The pensioner disregard table, including saved combined capital.
 */
function toPensionerTable(
  client: ClientCapitalSummary,
  partner: PartnerCapitalSummary,
): MeansAssessmentCalculationTable {
  const totalCapital = sumSavedAmounts(
    client.total_capital_with_smod,
    partner.total_capital_with_smod,
  );
  const pensionerDisregard = sumSavedAmounts(
    client.pensioner_disregard_applied,
    partner.pensioner_disregard_applied,
  );

  return {
    heading: capital.t("tables.pensionerDisregard"),
    hint: capital.t("hints.pensionerTable"),
    rows: [
      toCapitalRow("combinedDisposableCapital", totalCapital),
      toCapitalRow("pensionerDisregard", negate(pensionerDisregard)),
      toCapitalRow(
        "combinedAssessedCapital",
        floorCombinedAssessedCapital(client.combined_assessed_capital),
        null,
        true,
      ),
    ],
  };
}
