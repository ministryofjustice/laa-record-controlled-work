import {
  CFE_MAX_VALUE,
  MINIMUM_ASSESSED_CAPITAL,
} from "#/export/sections/meansAssessment/calculations/calculations.constants.js";

const EMPTY_PARTNER_CAPITAL_SIZE = 0;
const NO_CFE_PROCEEDING_TYPES = 0;
const ZERO_AMOUNT = 0;

/**
 * Applies CCQ's zero floor to saved combined assessed capital for display.
 * CCQ: laa-check-client-qualifies/app/models/cfe_result.rb#raw_total_calculated_capital.
 * @param amount Saved combined assessed capital, if present.
 * @returns The saved amount floored at zero, or null when missing.
 */
export function floorCombinedAssessedCapital(
  amount: null | number | undefined,
): null | number {
  if (amount === null || amount === undefined) {
    return null;
  }
  return Math.max(amount, MINIMUM_ASSESSED_CAPITAL);
}

/**
 * Uses saved result presence to decide whether CCQ renders partner tables.
 * @param partnerCapital Saved partner capital object.
 * @returns Whether a partner table is required, or null for incompatible data.
 */
export function hasSavedPartner(partnerCapital: unknown): boolean | null {
  if (
    partnerCapital === undefined ||
    partnerCapital === null ||
    partnerCapital === false ||
    partnerCapital === ""
  ) {
    return false;
  }
  if (typeof partnerCapital !== "object" || Array.isArray(partnerCapital)) {
    return null;
  }

  // Match CfeResult#has_partner? using saved results, not answer selectors.
  // CCQ: laa-check-client-qualifies/app/models/cfe_result.rb#has_partner?.
  return Object.keys(partnerCapital).length > EMPTY_PARTNER_CAPITAL_SIZE;
}

/**
 * Negates a saved deduction while preserving missing, zero, and sentinel values.
 * CCQ: laa-check-client-qualifies/app/models/cfe_result.rb#employment_deduction.
 * @param amount Saved CFE deduction amount.
 * @returns The negative amount, or the unchanged nullish, zero, or sentinel value.
 */
export function negate(
  amount: null | number | undefined,
): null | number | undefined {
  if (
    amount === null ||
    amount === undefined ||
    amount === ZERO_AMOUNT ||
    amount === CFE_MAX_VALUE
  ) {
    return amount;
  }
  return -amount;
}

/**
 * Selects the minimum saved proceeding threshold for detailed output.
 * @param proceedingTypes Saved proceeding thresholds.
 * @returns The minimum threshold, or null when no threshold exists.
 */
export function toMinimumUpperThreshold(
  proceedingTypes: Array<{ upper_threshold: number }>,
): null | number {
  if (proceedingTypes.length === NO_CFE_PROCEEDING_TYPES) {
    return null;
  }

  // Detailed limits use the minimum; key totals retain their first entry.
  // CCQ: laa-check-client-qualifies/app/models/cfe_result.rb#raw_disposable_income_upper_threshold;
  // app/models/calculation_result.rb#summary_data retains first-entry limits.
  return Math.min(
    ...proceedingTypes.map((proceeding) => proceeding.upper_threshold),
  );
}
