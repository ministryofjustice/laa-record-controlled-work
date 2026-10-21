import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { MeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import type {
  MeansAssessmentCalculationBreakdown,
  MeansAssessmentCalculationTable,
} from "#/export/sections/meansAssessment/meansAssessment.types.js";

import {
  hasSavedPartner,
  toMinimumUpperThreshold,
} from "#/export/sections/meansAssessment/calculations/calculations.helpers.js";
import { MeansAssessmentStatus } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import {
  formatOutgoingsCurrency,
  toAdultRows,
  toHouseholdRows,
  toPartnerRows,
} from "#/export/sections/meansAssessment/calculations/outgoings/outgoings.format.js";
import { outgoingsResultSchema } from "#/export/sections/meansAssessment/calculations/outgoings/outgoings.zod.js";
import { fixedT } from "#/lib/i18n.js";

const outgoings = {
  t: fixedT("pages.export.meansAssessment.calculations.outgoings"),
};

/**
 * Maps saved disposable-income rows without deriving their amounts.
 * @param result Saved CFE result.
 * @param answers Saved CCQ answers used for presentation relevance.
 * @param calculations Existing outcome and category calculation states.
 * @returns Prepared outgoing tables, or an omitted/unavailable state.
 */
export function toMeansAssessmentOutgoingsBreakdown(
  result: null | Record<string, unknown> | undefined,
  answers: EligibilityData | null | undefined,
  calculations: MeansAssessmentCalculations,
): MeansAssessmentCalculationBreakdown {
  if (calculations.status !== MeansAssessmentStatus.Ready) {
    return { status: "unavailable" };
  }
  if (
    calculations.disposableIncome.status !== MeansAssessmentStatus.Calculated
  ) {
    return { status: "not-calculated" };
  }

  const parsed = outgoingsResultSchema.safeParse(result);
  if (!parsed.success) {
    return unavailableOutgoingsBreakdown();
  }

  /* eslint-disable @typescript-eslint/naming-convention -- CCQ keys */
  const { assessment, result_summary } = parsed.data;
  const { disposable_income, partner_disposable_income } = result_summary;
  const {
    combined_total_disposable_income,
    combined_total_outgoings_and_allowances,
    employment_income,
    partner_allowance,
    proceeding_types,
  } = disposable_income;
  /* eslint-enable @typescript-eslint/naming-convention */
  const savedPartner = hasSavedPartner(assessment.partner_capital);

  if (savedPartner === null) {
    return unavailableOutgoingsBreakdown();
  }

  const upperThreshold = toMinimumUpperThreshold(proceeding_types);
  if (upperThreshold === null) {
    return unavailableOutgoingsBreakdown();
  }

  const clientRows = toAdultRows({
    answers,
    deductions: employment_income,
    details: assessment.disposable_income,
    partnerAllowance: partner_allowance,
    person: "client",
  });
  const householdRows = toHouseholdRows({
    answers,
    hasResultPartner: savedPartner,
    summary: disposable_income,
  });

  const tables: MeansAssessmentCalculationTable[] = [
    {
      heading: outgoings.t("clientHeading"),
      hint: outgoings.t("monthlyHint"),
      rows: savedPartner ? clientRows : [...clientRows, ...householdRows],
    },
  ];

  if (savedPartner) {
    const partnerRows = toPartnerRows(
      assessment.partner_disposable_income,
      partner_disposable_income,
      answers,
    );
    if (partnerRows === null) {
      return unavailableOutgoingsBreakdown();
    }
    tables.push(
      {
        heading: outgoings.t("partnerHeading"),
        hint: outgoings.t("monthlyHint"),
        rows: partnerRows,
      },
      {
        heading: outgoings.t("householdHeading"),
        hint: outgoings.t("monthlyHint"),
        rows: householdRows,
      },
    );
  }

  const combinedTotalHeading = outgoings.t(
    savedPartner ? "combinedTotal" : "clientTotal",
  );

  tables.push({
    heading: outgoings.t("totalHeading"),
    hint: null,
    rows: [
      {
        amount: formatOutgoingsCurrency(
          combined_total_outgoings_and_allowances,
        ),
        emphasis: true,
        heading: combinedTotalHeading,
        hint: null,
      },
      {
        amount: formatOutgoingsCurrency(combined_total_disposable_income),
        heading: outgoings.t("disposableIncome"),
        hint: outgoings.t("disposableIncomeHint"),
      },
      {
        amount: formatOutgoingsCurrency(upperThreshold),
        heading: outgoings.t("upperThreshold"),
        hint: null,
      },
    ],
  });

  return {
    heading: outgoings.t("heading"),
    status: "ready",
    tables,
  };
}

/**
 * Prepares the fallback when required saved outgoing details are incompatible.
 * @returns The outgoing heading and neutral availability message.
 */
function unavailableOutgoingsBreakdown(): MeansAssessmentCalculationBreakdown {
  return {
    heading: outgoings.t("heading"),
    message: outgoings.t("unavailable"),
    status: "unavailable",
  };
}
