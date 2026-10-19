import type { MeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import type { MeansAssessmentCalculationBreakdown } from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { hasSavedPartner } from "#/export/sections/meansAssessment/calculations/calculations.helpers.js";
import { MeansAssessmentStatus } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import { toPropertyTables } from "#/export/sections/meansAssessment/calculations/capital/properties.mapper.js";
import { propertyAssessmentDetailsSchema } from "#/export/sections/meansAssessment/calculations/capital/properties.zod.js";
import { fixedT } from "#/lib/i18n.js";

const capital = {
  t: fixedT("pages.export.meansAssessment.calculations.capital"),
};

/**
 * Maps saved property details when CFE calculated capital.
 * @param result Saved CFE result.
 * @param calculations Existing outcome and category calculation states.
 * @returns Prepared capital properties, or an omitted/unavailable state.
 */
export function toMeansAssessmentCapitalBreakdown(
  result: null | Record<string, unknown> | undefined,
  calculations: MeansAssessmentCalculations,
): MeansAssessmentCalculationBreakdown {
  if (calculations.status !== MeansAssessmentStatus.Ready) {
    return { status: "unavailable" };
  }
  if (calculations.capital.status !== MeansAssessmentStatus.Calculated) {
    return { status: "not-calculated" };
  }

  const parsed = propertyAssessmentDetailsSchema.safeParse(result);
  if (!parsed.success) {
    return unavailableCapitalBreakdown();
  }

  const { assessment } = parsed.data;
  const partnerCapital = assessment?.partner_capital;
  const hasPartner = hasSavedPartner(partnerCapital);
  if (hasPartner === null) {
    return unavailableCapitalBreakdown();
  }

  const tables = toPropertyTables(
    assessment?.capital,
    partnerCapital,
    hasPartner,
  );
  if (tables === null) {
    return unavailableCapitalBreakdown();
  }

  return {
    description: [
      capital.t(
        hasPartner ? "partnerPropertyDescription" : "clientPropertyDescription",
      ),
      capital.t(
        hasPartner ? "partnerTotalDescription" : "clientTotalDescription",
      ),
    ],
    heading: capital.t("heading"),
    status: "ready",
    tables,
  };
}

/**
 * Prepares the neutral fallback for incompatible property details.
 * @returns The capital heading and unavailable-details message.
 */
function unavailableCapitalBreakdown(): MeansAssessmentCalculationBreakdown {
  return {
    heading: capital.t("heading"),
    message: capital.t("unavailable"),
    status: "unavailable",
  };
}
