import type { MeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import type {
  MeansAssessmentCalculationBreakdown,
  MeansAssessmentCalculationTable,
} from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { hasSavedPartner } from "#/export/sections/meansAssessment/calculations/calculations.helpers.js";
import { MeansAssessmentStatus } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import { toDisposableCapitalBreakdownTables } from "#/export/sections/meansAssessment/calculations/capital/disposableCapital.mapper.js";
import { toPropertyTables } from "#/export/sections/meansAssessment/calculations/capital/properties.mapper.js";
import { propertyAssessmentDetailsSchema } from "#/export/sections/meansAssessment/calculations/capital/properties.zod.js";
import { fixedT } from "#/lib/i18n.js";

const capital = {
  t: fixedT("pages.export.meansAssessment.calculations.capital"),
};

interface CapitalDetailTables {
  disposableCapitalTables: MeansAssessmentCalculationTable[] | null;
  hasPartner: boolean;
  propertyTables: MeansAssessmentCalculationTable[] | null;
}

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

  const details = toCapitalDetailTables(result);
  if (details === null) {
    return unavailableCapitalBreakdown();
  }

  const propertyUnavailable = details.propertyTables === null;
  const disposableCapitalUnavailable = details.disposableCapitalTables === null;
  if (propertyUnavailable && disposableCapitalUnavailable) {
    return unavailableCapitalBreakdown();
  }

  return {
    description: capitalDescription(details.hasPartner),
    heading: capital.t("heading"),
    ...(propertyUnavailable || disposableCapitalUnavailable
      ? { message: capital.t("unavailable") }
      : {}),
    status: "ready",
    tables: [
      ...(details.propertyTables ?? []),
      ...(details.disposableCapitalTables ?? []),
    ],
  };
}

/**
 * Prepares saved capital descriptions for client or partner results.
 * @param hasPartner Whether saved assessment capital contains a partner.
 * @returns Property and total descriptions in CCQ order.
 */
function capitalDescription(hasPartner: boolean): string[] {
  return [
    capital.t(
      hasPartner ? "partnerPropertyDescription" : "clientPropertyDescription",
    ),
    capital.t(
      hasPartner ? "partnerTotalDescription" : "clientTotalDescription",
    ),
  ];
}

/**
 * Parses partner presence and the independent capital detail groups.
 * @param result Saved CFE result.
 * @returns Parsed detail states, or null when partner presence is incompatible.
 */
function toCapitalDetailTables(
  result: null | Record<string, unknown> | undefined,
): CapitalDetailTables | null {
  const parsed = propertyAssessmentDetailsSchema.safeParse(result);
  if (!parsed.success) {
    return null;
  }

  const { assessment } = parsed.data;
  const partnerCapital = assessment?.partner_capital;
  const hasPartner = hasSavedPartner(partnerCapital);
  if (hasPartner === null) {
    return null;
  }

  return {
    disposableCapitalTables: toDisposableCapitalBreakdownTables(
      result,
      hasPartner,
    ),
    hasPartner,
    propertyTables: toPropertyTables(
      assessment?.capital,
      partnerCapital,
      hasPartner,
    ),
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
