const EMPTY_PARTNER_CAPITAL_SIZE = 0;
const NO_CFE_PROCEEDING_TYPES = 0;

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
