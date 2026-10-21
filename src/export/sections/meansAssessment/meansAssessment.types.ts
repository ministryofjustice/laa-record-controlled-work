import type { MeansAssessmentAnswerSummary } from "#/export/sections/meansAssessment/answers/answers.types.js";
import type { MeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.types.js";

export type MeansAssessmentCalculationBreakdown =
  | {
      description?: string[];
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

export type MeansAssessmentCalculationCell =
  { classes: string; html: string } | { classes: string; text: string };

export interface MeansAssessmentCalculationPresentation {
  description: string[];
  heading: string;
  message: null | string;
  tables: MeansAssessmentCalculationTablePresentation[];
}

export interface MeansAssessmentCalculationRow {
  additionalHint?: null | string;
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

export interface MeansAssessmentCalculationTablePresentation {
  caption: string;
  captionClasses: string;
  classes: string;
  firstCellIsHeader: boolean;
  hint: null | string;
  rows: MeansAssessmentCalculationCell[][];
}

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
  calculationBreakdowns: MeansAssessmentCalculationPresentation[];
  calculations: MeansAssessmentCalculations;
  capitalBreakdown: MeansAssessmentCalculationBreakdown;
  incomeBreakdown: MeansAssessmentCalculationBreakdown;
  outcomeSummary: MeansAssessmentOutcomeSummary;
  outgoingsBreakdown: MeansAssessmentCalculationBreakdown;
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
