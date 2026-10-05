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
  cfeResultSchema,
  type CfeResultSummary,
} from "#/export/sections/meansAssessment/calculations/calculations.zod.js";

const CFE_MAX_VALUE = 999_999_999_999;
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
  if (categories === null) {
    return { status: MeansAssessmentStatus.Unavailable };
  }
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
  const {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    aggregated_means,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    asylum_support,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    client_age,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    controlled_legal_representation,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    immigration_or_asylum,
    passporting,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    regular_income,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    under_eighteen_assets,
  } = data;

  const hasAsylumSupportExemption = immigration_or_asylum && asylum_support;

  const hasNoUnderEighteenIncomeOrAssets =
    !aggregated_means && !regular_income && !under_eighteen_assets;

  const hasUnderEighteenExemption =
    client_age === ClientAgeRange.Under18 &&
    (controlled_legal_representation ?? hasNoUnderEighteenIncomeOrAssets);

  return passporting ?? hasAsylumSupportExemption ?? hasUnderEighteenExemption;
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
): MeansAssessmentCategorySet | null {
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

  if (grossIncome === null || disposableIncome === null || capital === null) {
    return null;
  }

  return [capital, disposableIncome, grossIncome];
}

/**
 * Maps a saved category total and its first proceeding type without deriving values.
 * @param category Saved CFE category.
 * @param totalKey Saved total field for the category.
 * @returns A calculated category, an uncalculated state, or null for incompatible fields.
 */
function toCategory(
  category: CfeCategory | null | undefined,
  totalKey: MeansAssessmentTotalField,
): MeansAssessmentCategory | null {
  if (category === undefined || category === null) {
    return { status: MeansAssessmentStatus.NotCalculated };
  }

  const proceedingTypes = category.proceeding_types;
  if (
    proceedingTypes === undefined ||
    proceedingTypes === null ||
    proceedingTypes.length === NO_CFE_PROCEEDING_TYPES
  ) {
    return { status: MeansAssessmentStatus.NotCalculated };
  }

  const [firstProceedingType] = proceedingTypes;
  const total = category[totalKey];
  if (total === null || total === undefined) {
    return null;
  }

  const outcome: MeansAssessmentCategoryOutcome = firstProceedingType.result;
  const upperThreshold = firstProceedingType.upper_threshold;

  return {
    noUpperThreshold: upperThreshold === CFE_MAX_VALUE,
    outcome,
    status: MeansAssessmentStatus.Calculated,
    total,
    upperThreshold,
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
  if (outcome === "eligible" || outcome === "contribution_required") {
    return outcome;
  }

  return null;
}
