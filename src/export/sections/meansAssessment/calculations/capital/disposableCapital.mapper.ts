import type { MeansAssessmentCalculationTable } from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { toMinimumUpperThreshold } from "#/export/sections/meansAssessment/calculations/calculations.helpers.js";
import { toDisposableCapitalTables } from "#/export/sections/meansAssessment/calculations/capital/disposableCapital.format.js";
import {
  capitalResultSummarySchema,
  clientAdultCapitalSchema,
  partnerCapitalSummarySchema,
} from "#/export/sections/meansAssessment/calculations/capital/disposableCapital.zod.js";

/**
 * Maps saved disposable-capital details independently of property details.
 * @param result Saved CFE result.
 * @param hasPartner Whether saved assessment capital contains a partner.
 * @returns Prepared tables, or null when consumed details are incompatible.
 */
export function toDisposableCapitalBreakdownTables(
  result: null | Record<string, unknown> | undefined,
  hasPartner: boolean,
): MeansAssessmentCalculationTable[] | null {
  const parsed = capitalResultSummarySchema.safeParse(result);
  if (!parsed.success) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention -- matches CCQ Keys
  const { capital, partner_capital } = parsed.data.result_summary;
  const upperThreshold = toMinimumUpperThreshold(capital.proceeding_types);
  if (upperThreshold === null) {
    return null;
  }
  if (!hasPartner) {
    return toDisposableCapitalTables({
      client: capital,
      hasPartner,
      partner: null,
      upperThreshold,
    });
  }

  const parsedClient = clientAdultCapitalSchema.safeParse(capital);
  const parsedPartner = partnerCapitalSummarySchema.safeParse(partner_capital);
  if (!parsedClient.success || !parsedPartner.success) {
    return null;
  }

  return toDisposableCapitalTables({
    client: { ...capital, ...parsedClient.data },
    hasPartner,
    partner: parsedPartner.data,
    upperThreshold,
  });
}
