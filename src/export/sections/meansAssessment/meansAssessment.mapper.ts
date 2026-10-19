import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type {
  MeansAssessmentCalculations,
  MeansAssessmentCategory,
} from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import type {
  MeansAssessmentOutcomeSummary,
  MeansAssessmentSection,
  MeansAssessmentTotalPresentation,
  MeansAssessmentTotalsSummary,
} from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { toMeansAssessmentAnswerSummaries } from "#/export/sections/meansAssessment/answers/answers.mapper.js";
import { toCalculationBreakdowns } from "#/export/sections/meansAssessment/calculations/calculations.format.js";
import { toMeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.mapper.js";
import { MeansAssessmentStatus } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import { toMeansAssessmentCapitalBreakdown } from "#/export/sections/meansAssessment/calculations/capital/capital.mapper.js";
import { toMeansAssessmentIncomeBreakdown } from "#/export/sections/meansAssessment/calculations/income/income.mapper.js";
import { toMeansAssessmentOutgoingsBreakdown } from "#/export/sections/meansAssessment/calculations/outgoings/outgoings.mapper.js";
import { formatGBP } from "#/lib/currency.js";
import { fixedT } from "#/lib/i18n.js";

const means = {
  t: fixedT("pages.export.meansAssessment"),
};

/**
 * Maps a saved means assessment to its export section without recalculating CFE values.
 * @param application Validated application returned by the RCW API.
 * @returns The mapped section, or null when a means assessment is explicitly not required.
 */
export function toMeansAssessmentSection(
  application: Application,
): MeansAssessmentSection | null {
  const { eligibility, meansAssessmentRequired } = application;

  if (meansAssessmentRequired === false) {
    return null;
  }

  const calculations = toMeansAssessmentCalculations(
    eligibility?.result,
    eligibility?.data,
  );
  const incomeBreakdown = toMeansAssessmentIncomeBreakdown(
    eligibility?.result,
    calculations,
  );
  const outgoingsBreakdown = toMeansAssessmentOutgoingsBreakdown(
    eligibility?.result,
    eligibility?.data,
    calculations,
  );
  const capitalBreakdown = toMeansAssessmentCapitalBreakdown(
    eligibility?.result,
    calculations,
  );

  return {
    answerSummaries: toMeansAssessmentAnswerSummaries(eligibility?.data),
    calculationBreakdowns: toCalculationBreakdowns([
      incomeBreakdown,
      outgoingsBreakdown,
      capitalBreakdown,
    ]),
    calculations,
    capitalBreakdown,
    incomeBreakdown,
    outcomeSummary: toMeansAssessmentOutcomeSummary(calculations),
    outgoingsBreakdown,
  };
}

/**
 * Formats a saved amount without hiding non-zero pence.
 * @param amount Saved CFE amount or threshold.
 * @returns The amount formatted in pounds sterling.
 */
function formatCurrency(amount: number): string {
  return formatGBP(amount, true);
}

/**
 * Formats saved contribution values only for a contribution outcome.
 * @param calculations Saved means calculation state.
 * @returns Present income and capital contribution lines in CCQ order.
 */
function toContributionSummaries(
  calculations: MeansAssessmentCalculations,
): string[] {
  if (
    calculations.status !== MeansAssessmentStatus.Ready ||
    calculations.outcome !== "contribution_required"
  ) {
    return [];
  }

  const contributions: string[] = [];
  if (calculations.incomeContribution !== null) {
    contributions.push(
      means.t("outcomes.contributionRequired.incomeContribution", {
        amount: formatCurrency(calculations.incomeContribution),
      }),
    );
  }
  if (calculations.capitalContribution !== null) {
    contributions.push(
      means.t("outcomes.contributionRequired.capitalContribution", {
        amount: formatCurrency(calculations.capitalContribution),
      }),
    );
  }

  return contributions;
}

/**
 * Prepares translated outcome and total text without deriving calculations.
 * @param calculations Saved CFE values already mapped for the export.
 * @returns Plain-text data ready for the export template.
 */
function toMeansAssessmentOutcomeSummary(
  calculations: MeansAssessmentCalculations,
): MeansAssessmentOutcomeSummary {
  const outcomeKey = toOutcomeKey(calculations);
  const contributions = toContributionSummaries(calculations);

  return {
    heading: means.t("heading"),
    outcome: {
      contributions,
      description: means.t(`outcomes.${outcomeKey}.description`),
      heading: means.t(`outcomes.${outcomeKey}.heading`),
    },
    totals: toTotalSummaries(calculations),
    yourAnswersHeading: means.t("yourAnswers"),
  };
}

/**
 * Selects the message key for a saved calculation outcome.
 * @param calculations Saved means calculation state.
 * @returns The outcome translation key.
 */
function toOutcomeKey(
  calculations: MeansAssessmentCalculations,
): "contributionRequired" | "eligible" | "unavailable" {
  if (calculations.status !== MeansAssessmentStatus.Ready) {
    return "unavailable";
  }
  if (calculations.outcome === "contribution_required") {
    return "contributionRequired";
  }
  return "eligible";
}

/**
 * Selects the detail text for a calculated total.
 * @param key Locale key for the total.
 * @param category Saved calculated category and threshold.
 * @returns The applicable detail text, or null when the total is unavailable.
 */
function toTotalDetail(
  key: "capital" | "disposableIncome" | "grossIncome",
  category: MeansAssessmentCategory,
): null | string {
  if (
    category.status !== MeansAssessmentStatus.Calculated ||
    category.total === null
  ) {
    return null;
  }
  if (category.noUpperThreshold) {
    return means.t("totals.noUpperLimit");
  }
  if (category.outcome === "ineligible") {
    return means.t("totals.exceedsUpperLimit", {
      amount: formatCurrency(category.upperThreshold),
    });
  }
  if (category.outcome === "contribution_required") {
    return means.t("totals.contributionRequired");
  }
  if (key === "grossIncome") {
    return means.t("totals.belowUpperLimit", {
      amount: formatCurrency(category.upperThreshold),
    });
  }
  return means.t("totals.eligible");
}

/**
 * Selects calculated totals in the order used by the result summary.
 * @param calculations Saved means calculation state.
 * @returns Prepared totals, excluding categories CFE did not calculate.
 */
function toTotalSummaries(
  calculations: MeansAssessmentCalculations,
): MeansAssessmentTotalsSummary | null {
  if (calculations.status !== MeansAssessmentStatus.Ready) {
    return null;
  }

  const totals: MeansAssessmentTotalPresentation[] = [];
  const categories = [
    ["grossIncome", calculations.grossIncome],
    ["disposableIncome", calculations.disposableIncome],
    ["capital", calculations.capital],
  ] as const;

  for (const [key, category] of categories) {
    const summary = toTotalSummary(key, category);
    if (summary !== null) {
      totals.push(summary);
    }
  }

  if (!totals.length) {
    return null;
  }

  return {
    heading: means.t("totalsHeading"),
    items: totals,
  };
}

/**
 * Formats one saved calculated category for the key-total display.
 * @param key Locale key for the total.
 * @param category Saved category and threshold.
 * @returns A formatted total, or null when CFE did not calculate it.
 */
function toTotalSummary(
  key: "capital" | "disposableIncome" | "grossIncome",
  category: MeansAssessmentCategory,
): MeansAssessmentTotalPresentation | null {
  if (category.status !== MeansAssessmentStatus.Calculated) {
    return null;
  }
  const amount =
    category.total === null
      ? means.t("totals.notAvailable")
      : formatCurrency(category.total);

  return {
    amount,
    detail: toTotalDetail(key, category),
    heading: means.t(`totals.${key}`),
  };
}
