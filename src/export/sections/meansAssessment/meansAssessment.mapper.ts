import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type {
  MeansAssessmentCalculations,
  MeansAssessmentCategory,
  MeansAssessmentCategoryOutcome,
  MeansAssessmentCategorySet,
  MeansAssessmentOutcome,
  MeansAssessmentSection,
} from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { toMeansAssessmentAnswerSummaries } from "#/export/sections/meansAssessment/answers/answers.mapper.js";
import {
  type CfeCategory,
  cfeResultSchema,
  type CfeResultSummary,
  exemptionAnswersSchema,
} from "#/export/sections/meansAssessment/meansAssessment.zod.js";

const CFE_MAX_VALUE = 999_999_999_999;
const NO_CFE_PROCEEDING_TYPES = 0;

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

  return {
    answerSummaries: toMeansAssessmentAnswerSummaries(eligibility?.data),
    calculations: toMeansAssessmentCalculations(
      eligibility?.result,
      eligibility?.data,
    ),
  };
}

/**
 * Checks whether at least one CFE category has saved calculation output.
 * @param categories Mapped categories.
 * @returns Whether any category is calculated.
 */
function hasCalculatedCategory(
  categories: MeansAssessmentCategorySet,
): boolean {
  return (
    categories.grossIncome.status === "calculated" ||
    categories.disposableIncome.status === "calculated" ||
    categories.capital.status === "calculated"
  );
}

/**
 * Identifies saved answers that can validly produce an outcome without category calculations.
 * @param data Saved CCQ answers.
 * @returns Whether the answers describe a no-means-test or passporting route.
 */
function isMeansAssessmentExemptOrPassported(data: unknown): boolean {
  const parsed = exemptionAnswersSchema.safeParse(data);
  if (!parsed.success) {
    return false;
  }

  const answers = parsed.data;

  const isPassported = answers.passporting === true;

  const hasAsylumSupportExemption =
    answers.immigration_or_asylum === true && answers.asylum_support === true;

  const hasNoUnderEighteenIncomeOrAssets =
    answers.aggregated_means === false &&
    answers.regular_income === false &&
    answers.under_eighteen_assets === false;

  const hasUnderEighteenExemption =
    answers.client_age === "under_18" &&
    (answers.controlled_legal_representation === true ||
      hasNoUnderEighteenIncomeOrAssets);

  return isPassported || hasAsylumSupportExemption || hasUnderEighteenExemption;
}

/**
 * Parses a saved CFE result and returns its summary when structurally valid.
 * @param result Saved CFE result.
 * @returns The result summary, or null when unavailable or incompatible.
 */
function parseCfeResultSummary(result: unknown): CfeResultSummary | null {
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
    "combined_total_gross_income",
  );
  const disposableIncome = toCategory(
    resultSummary.disposable_income,
    "combined_total_disposable_income",
  );
  const capital = toCategory(
    resultSummary.capital,
    "combined_assessed_capital",
  );

  if (grossIncome === null || disposableIncome === null || capital === null) {
    return null;
  }

  return { capital, disposableIncome, grossIncome };
}

/**
 * Maps a saved category total and its first proceeding type without deriving values.
 * @param category Saved CFE category.
 * @param totalKey Saved total field for the category.
 * @returns A calculated category, an uncalculated state, or null for incompatible fields.
 */
function toCategory(
  category: CfeCategory | null | undefined,
  totalKey:
    | "combined_assessed_capital"
    | "combined_total_disposable_income"
    | "combined_total_gross_income",
): MeansAssessmentCategory | null {
  if (category === undefined || category === null) {
    return { status: "not_calculated" };
  }

  const proceedingTypes = category.proceeding_types;
  if (
    proceedingTypes === undefined ||
    proceedingTypes === null ||
    proceedingTypes.length === NO_CFE_PROCEEDING_TYPES
  ) {
    return { status: "not_calculated" };
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
    status: "calculated",
    total,
    upperThreshold,
  };
}

/**
 * Maps the saved CFE outcome and calculation totals.
 * @param result Saved CFE result.
 * @param data Saved CCQ answers.
 * @returns Ready calculations, or an unavailable state for unsupported results.
 */
function toMeansAssessmentCalculations(
  result: unknown,
  data: unknown,
): MeansAssessmentCalculations {
  const resultSummary = parseCfeResultSummary(result);
  if (resultSummary === null) {
    return { status: "unavailable" };
  }

  const overallResult = resultSummary.overall_result;
  if (overallResult === undefined || overallResult === null) {
    return { status: "unavailable" };
  }

  const outcome = toMeansAssessmentOutcome(overallResult.result);
  if (outcome === null) {
    return { status: "unavailable" };
  }

  const categories = toCategories(resultSummary);
  if (categories === null) {
    return { status: "unavailable" };
  }

  if (
    !hasCalculatedCategory(categories) &&
    !isMeansAssessmentExemptOrPassported(data)
  ) {
    return { status: "unavailable" };
  }

  return {
    ...categories,
    capitalContribution: overallResult.capital_contribution ?? null,
    incomeContribution: overallResult.income_contribution ?? null,
    outcome,
    status: "ready",
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
