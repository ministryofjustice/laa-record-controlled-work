import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type {
  MeansAssessmentCalculations,
  MeansAssessmentCategory,
  MeansAssessmentCategoryOutcome,
  MeansAssessmentCategorySet,
  MeansAssessmentOutcome,
} from "#/export/sections/meansAssessment/calculations/calculations.types.js";

import { ClientAgeRange } from "#/api/eligibility/eligibility.types.js";
import {
  MeansAssessmentStatus,
  MeansAssessmentTotalField,
} from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import {
  type CfeCategory,
  CfeOutcomes,
  cfeResultSchema,
  type CfeResultSummary,
} from "#/export/sections/meansAssessment/calculations/calculations.zod.js";

const CFE_MAX_VALUE = 999_999_999_999;
const MINIMUM_ASSESSED_CAPITAL = 0;
const NO_CFE_PROCEEDING_TYPES = 0;

/**
 * Maps the saved CFE outcome and calculation totals.
 * @param result Saved CFE result.
 * @param data Saved CCQ answers.
 * @returns Ready calculations, or an unavailable state for unsupported results.
 */
export function toMeansAssessmentCalculations(
  result: null | Record<string, unknown> | undefined,
  data: EligibilityData | null | undefined,
): MeansAssessmentCalculations {
  const resultSummary = parseCfeResultSummary(result);
  if (resultSummary === null) {
    return { status: MeansAssessmentStatus.Unavailable };
  }

  const overallResult = resultSummary.overall_result;
  if (overallResult === undefined || overallResult === null) {
    return { status: MeansAssessmentStatus.Unavailable };
  }

  const outcome = toMeansAssessmentOutcome(overallResult.result);
  if (outcome === null) {
    return { status: MeansAssessmentStatus.Unavailable };
  }

  const categories = toCategories(resultSummary);
  const hasCalculatedCategory = categories.some(
    (category) => category.status === MeansAssessmentStatus.Calculated,
  );

  if (!hasCalculatedCategory && !isMeansAssessmentExemptOrPassported(data)) {
    return { status: MeansAssessmentStatus.Unavailable };
  }

  const [capital, disposableIncome, grossIncome] = categories;

  return {
    capital,
    capitalContribution: overallResult.capital_contribution ?? null,
    disposableIncome,
    grossIncome,
    incomeContribution: overallResult.income_contribution ?? null,
    outcome,
    status: MeansAssessmentStatus.Ready,
  };
}

/**
 * Identifies saved answers that can validly produce an outcome without category calculations.
 * @param data Saved CCQ answers.
 * @returns Whether the answers describe a no-means-test or passporting route.
 */
function isMeansAssessmentExemptOrPassported(
  data: EligibilityData | null | undefined,
): boolean {
  if (data === null || data === undefined) {
    return false;
  }
  /* eslint-disable @typescript-eslint/naming-convention -- API field names */
  const {
    aggregated_means,
    asylum_support,
    client_age,
    controlled_legal_representation,
    immigration_or_asylum,
    passporting,
    regular_income,
    under_eighteen_assets,
  } = data;
  /* eslint-enable @typescript-eslint/naming-convention */

  const hasAsylumSupportExemption = immigration_or_asylum && asylum_support;

  const hasNoUnderEighteenIncomeOrAssets =
    !aggregated_means && !regular_income && !under_eighteen_assets;

  const hasUnderEighteenExemption =
    client_age === ClientAgeRange.Under18 &&
    [
      controlled_legal_representation,
      hasNoUnderEighteenIncomeOrAssets,
    ].includes(true);

  return [
    hasAsylumSupportExemption,
    hasUnderEighteenExemption,
    passporting,
  ].includes(true);
}

/**
 * Parses a saved CFE result and returns its summary when structurally valid.
 * @param result Saved CFE result.
 * @returns The result summary, or null when unavailable or incompatible.
 */
function parseCfeResultSummary(
  result: null | Record<string, unknown> | undefined,
): CfeResultSummary | null {
  const parsed = cfeResultSchema.safeParse(result);
  if (!parsed.success) {
    return null;
  }

  const resultSummary = parsed.data.result_summary;
  if (resultSummary === undefined || resultSummary === null) {
    return null;
  }

  return resultSummary;
}

/**
 * Maps the three saved calculation categories when their result fields are compatible.
 * @param resultSummary Validated CFE result summary.
 * @returns Mapped categories, or null when a calculated category is incomplete.
 */
function toCategories(
  resultSummary: CfeResultSummary,
): MeansAssessmentCategorySet {
  const grossIncome = toCategory(
    resultSummary.gross_income,
    MeansAssessmentTotalField.CombinedTotalGrossIncome,
  );
  const disposableIncome = toCategory(
    resultSummary.disposable_income,
    MeansAssessmentTotalField.CombinedTotalDisposableIncome,
  );
  const capital = toCategory(
    resultSummary.capital,
    MeansAssessmentTotalField.CombinedAssessedCapital,
  );

  return [capital, disposableIncome, grossIncome];
}

/**
 * Maps a saved category total and its first proceeding type without deriving values.
 * @param category Saved CFE category.
 * @param totalKey Saved total field for the category.
 * @returns A calculated category or an uncalculated state.
 */
function toCategory(
  category: CfeCategory | null | undefined,
  totalKey: MeansAssessmentTotalField,
): MeansAssessmentCategory {
  if (category === undefined || category === null) {
    return { status: MeansAssessmentStatus.NotCalculated };
  }

  const proceeding = toCategoryProceeding(category.proceeding_types);
  if (proceeding === null) {
    return { status: MeansAssessmentStatus.NotCalculated };
  }

  const total = category[totalKey];
  let mappedTotal = total ?? null;
  if (
    mappedTotal !== null &&
    totalKey === MeansAssessmentTotalField.CombinedAssessedCapital
  ) {
    mappedTotal = Math.max(mappedTotal, MINIMUM_ASSESSED_CAPITAL);
  }

  return {
    // CCQ upperThreshold comparison: laa-check-client-qualifies/app/models/calculation_result.rb:39.
    noUpperThreshold: proceeding.upperThreshold === CFE_MAX_VALUE,
    outcome: proceeding.outcome,
    status: MeansAssessmentStatus.Calculated,
    total: mappedTotal,
    upperThreshold: proceeding.upperThreshold,
  };
}

/**
 * Maps proceeding results using CCQ's calculated and first-result rules.
 * @param proceedingTypes Saved proceeding results for a category.
 * @returns The CCQ summary result and threshold, or null when uncalculated.
 */
function toCategoryProceeding(
  proceedingTypes: CfeCategory["proceeding_types"],
): null | {
  outcome: MeansAssessmentCategoryOutcome;
  upperThreshold: number;
} {
  if (
    proceedingTypes === undefined ||
    proceedingTypes === null ||
    proceedingTypes.length === NO_CFE_PROCEEDING_TYPES ||
    // Match CCQ's any-calculated-result check in laa-check-client-qualifies/app/models/cfe_result.rb:31.
    !proceedingTypes.some(
      ({ result }) => result !== CfeOutcomes.enum.not_calculated,
    )
  ) {
    return null;
  }
  // Match CCQ's first-entry reads in CfeResult: cfe_result.rb:36,41.
  const [firstProceedingType] = proceedingTypes;
  // Match CCQ's eligible default to treat not_calculated as eligible: laa-check-client-qualifies/app/models/calculation_result.rb:48.
  const outcome =
    firstProceedingType.result === CfeOutcomes.enum.not_calculated
      ? CfeOutcomes.enum.eligible
      : firstProceedingType.result;

  return {
    outcome,
    upperThreshold: firstProceedingType.upper_threshold,
  };
}

/**
 * Returns an exportable CFE outcome when it is supported for controlled work.
 * @param outcome Saved overall CFE outcome.
 * @returns A supported outcome, or null for ineligible and unknown results.
 */
function toMeansAssessmentOutcome(
  outcome: null | string | undefined,
): MeansAssessmentOutcome | null {
  if (
    outcome === CfeOutcomes.enum.eligible ||
    outcome === CfeOutcomes.enum.contribution_required
  ) {
    return outcome;
  }

  return null;
}
