import type { MeansAssessmentAnswerSummary } from "#/export/sections/meansAssessment/answers/answers.types.js";
import type { MeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.types.js";

export interface MeansAssessmentCalculationRow {
  amount: string;
  emphasis?: boolean;
  heading: string;
  hint: null | string;
}

export interface MeansAssessmentCalculationTable {
  heading: string;
  hint: null | string;
  rows: MeansAssessmentCalculationRow[];
}

export type MeansAssessmentIncomeBreakdown =
  | {
      heading: string;
      status: "ready";
      tables: MeansAssessmentCalculationTable[];
    }
  | {
      heading?: string;
      message?: string;
      status: "unavailable";
    }
  | { status: "not-calculated" };

export interface MeansAssessmentOutcomePresentation {
  contributions: string[];
  description: string;
  heading: string;
}

export interface MeansAssessmentOutcomeSummary {
  heading: string;
  outcome: MeansAssessmentOutcomePresentation;
  totals: MeansAssessmentTotalsSummary | null;
  yourAnswersHeading: string;
}

export interface MeansAssessmentSection {
  answerSummaries: MeansAssessmentAnswerSummary[];
  calculations: MeansAssessmentCalculations;
  incomeBreakdown: MeansAssessmentIncomeBreakdown;
  outcomeSummary: MeansAssessmentOutcomeSummary;
}

export interface MeansAssessmentTotalPresentation {
  amount: string;
  detail: null | string;
  heading: string;
}

export interface MeansAssessmentTotalsSummary {
  heading: string;
  items: MeansAssessmentTotalPresentation[];
}
