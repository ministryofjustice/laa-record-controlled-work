import type { MeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import type {
  MeansAssessmentCalculationRow,
  MeansAssessmentCalculationTable,
  MeansAssessmentIncomeBreakdown,
} from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { MeansAssessmentStatus } from "#/export/sections/meansAssessment/calculations/calculations.types.js";
import {
  employmentIncomeSchema,
  incomeResultSchema,
  incomeSourcesSchema,
} from "#/export/sections/meansAssessment/calculations/income/income.zod.js";
import { formatGBP } from "#/lib/currency.js";
import { fixedT } from "#/lib/i18n.js";

const CFE_MAX_VALUE = 999_999_999_999;
const EMPTY_PARTNER_CAPITAL_SIZE = 0;
const means = { t: fixedT("pages.export.meansAssessment") };
const income = {
  t: fixedT("pages.export.meansAssessment.calculations.income"),
};
const NO_CFE_PROCEEDING_TYPES = 0;
const ZERO_AMOUNT = 0;

/**
 * Maps saved income details independently from key eligibility totals.
 * @param result Saved CFE result.
 * @param calculations Existing outcome and category calculation states.
 * @returns Prepared income tables, or an omitted/unavailable state.
 */
export function toMeansAssessmentIncomeBreakdown(
  result: null | Record<string, unknown> | undefined,
  calculations: MeansAssessmentCalculations,
): MeansAssessmentIncomeBreakdown {
  if (calculations.status !== MeansAssessmentStatus.Ready) {
    return { status: "unavailable" };
  }

  if (calculations.grossIncome.status !== MeansAssessmentStatus.Calculated) {
    return { status: "not-calculated" };
  }

  const parsed = incomeResultSchema.safeParse(result);
  if (!parsed.success) {
    return unavailableIncomeBreakdown();
  }

  const clientRows = toIncomeRows(
    parsed.data.assessment.gross_income,
    parsed.data.result_summary.disposable_income,
  );
  if (clientRows === null) {
    return unavailableIncomeBreakdown();
  }

  const hasPartner = hasSavedPartner(parsed.data.assessment.partner_capital);
  if (hasPartner === null) {
    return unavailableIncomeBreakdown();
  }

  const tables: MeansAssessmentCalculationTable[] = [
    {
      heading: income.t("clientHeading"),
      hint: income.t("monthlyHint"),
      rows: clientRows,
    },
  ];

  if (hasPartner) {
    const partnerRows = toIncomeRows(
      parsed.data.assessment.partner_gross_income,
      parsed.data.result_summary.partner_disposable_income,
    );
    if (partnerRows === null) {
      return unavailableIncomeBreakdown();
    }
    tables.push({
      heading: income.t("partnerHeading"),
      hint: income.t("monthlyHint"),
      rows: partnerRows,
    });
  }

  const upperThreshold = toMinimumUpperThreshold(
    parsed.data.result_summary.gross_income.proceeding_types,
  );
  if (upperThreshold === null) {
    return unavailableIncomeBreakdown();
  }

  tables.push({
    heading: income.t("totalHeading"),
    hint: null,
    rows: [
      {
        amount: formatCurrency(calculations.grossIncome.total),
        emphasis: true,
        heading: income.t(hasPartner ? "combinedTotal" : "clientTotal"),
        hint: null,
      },
      {
        amount: formatCurrency(upperThreshold),
        heading: income.t("upperThreshold"),
        hint: null,
      },
    ],
  });

  return {
    heading: income.t("heading"),
    status: "ready",
    tables,
  };
}

/**
 * Formats one saved amount without hiding pence or missing values.
 * @param amount Saved amount, if present.
 * @returns A detailed GBP amount or the not-applicable label.
 */
function formatCurrency(amount: null | number | undefined): string {
  if (amount === null || amount === undefined || amount === CFE_MAX_VALUE) {
    return means.t("calculations.notApplicable");
  }

  return formatGBP(amount === ZERO_AMOUNT ? ZERO_AMOUNT : amount);
}

/**
 * Checks CCQ's result-based partner table selector.
 * @param partnerCapital Saved partner capital object.
 * @returns Whether a partner table is required, or null for incompatible data.
 */
function hasSavedPartner(partnerCapital: unknown): boolean | null {
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
  // laa-check-client-qualifies/app/models/cfe_result.rb
  return Object.keys(partnerCapital).length > EMPTY_PARTNER_CAPITAL_SIZE;
}

/**
 * Validates and formats the saved rows for one adult.
 * @param sources Saved gross-income assessment details.
 * @param disposableIncome Saved employment income details.
 * @returns Ordered rows, or null when a required structure is incompatible.
 */
function toIncomeRows(
  sources: unknown,
  disposableIncome: unknown,
): MeansAssessmentCalculationRow[] | null {
  const parsedSources = incomeSourcesSchema.safeParse(sources);
  const parsedEmployment = employmentIncomeSchema.safeParse(disposableIncome);
  if (!parsedSources.success || !parsedEmployment.success) {
    return null;
  }

  const {
    irregular_income: irregularIncome,
    other_income: otherIncome,
    state_benefits: stateBenefits,
  } = parsedSources.data;

  const { all_sources: benefits } = stateBenefits.monthly_equivalents;
  const { all_sources: other } = otherIncome.monthly_equivalents;
  const { student_loan: studentFinance, unspecified_source: otherSources } =
    irregularIncome.monthly_equivalents;
  const employmentIncome = parsedEmployment.data.employment_income.gross_income;

  return [
    { key: "employmentIncome", value: employmentIncome },
    { key: "benefits", value: benefits },
    { key: "friendsAndFamily", value: other.friends_or_family },
    { key: "maintenance", value: other.maintenance_in },
    { key: "propertyOrLodger", value: other.property_or_lodger },
    { key: "pensions", value: other.pension },
    { key: "studentFinance", value: studentFinance },
    { key: "other", value: otherSources },
  ].map(({ key, value }) => ({
    amount: formatCurrency(value),
    heading: income.t(`rows.${key}`),
    hint: key === "benefits" ? income.t("benefitsHint") : null,
  }));
}

/**
 * Selects the minimum saved proceeding threshold for detailed output.
 * @param proceedingTypes Saved gross-income proceeding thresholds.
 * @returns The minimum threshold, or null when no threshold exists.
 */
function toMinimumUpperThreshold(
  proceedingTypes: Array<{ upper_threshold: number }>,
): null | number {
  if (proceedingTypes.length === NO_CFE_PROCEEDING_TYPES) {
    return null;
  }

  // Detailed limits use the minimum; key totals retain their first entry.
  // CCQ: app/models/cfe_result.rb#raw_gross_income_upper_threshold;
  // app/models/calculation_result.rb#summary_data.
  return Math.min(
    ...proceedingTypes.map((proceeding) => proceeding.upper_threshold),
  );
}

/**
 * Prepares the neutral fallback when saved income details are incompatible.
 * @returns The income section heading and fallback message.
 */
function unavailableIncomeBreakdown(): MeansAssessmentIncomeBreakdown {
  return {
    heading: income.t("heading"),
    message: income.t("unavailable"),
    status: "unavailable",
  };
}
