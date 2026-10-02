export interface MeansAssessmentAnswerSummary {
  heading: string;
  rows: Array<{ key: string; value: string }>;
}

export type MeansAssessmentCalculations =
  | {
      capital: MeansAssessmentCategory;
      capitalContribution: null | number;
      disposableIncome: MeansAssessmentCategory;
      grossIncome: MeansAssessmentCategory;
      incomeContribution: null | number;
      outcome: MeansAssessmentOutcome;
      status: "ready";
    }
  | { status: "unavailable" };

export type MeansAssessmentCategory =
  | {
      noUpperThreshold: boolean;
      outcome: MeansAssessmentCategoryOutcome;
      status: "calculated";
      total: number;
      upperThreshold: number;
    }
  | { status: "not_calculated" };

export type MeansAssessmentCategoryOutcome =
  "contribution_required" | "eligible" | "ineligible";

export interface MeansAssessmentCategorySet {
  capital: MeansAssessmentCategory;
  disposableIncome: MeansAssessmentCategory;
  grossIncome: MeansAssessmentCategory;
}

export type MeansAssessmentOutcome = "contribution_required" | "eligible";

export interface MeansAssessmentSection {
  answerSummaries: MeansAssessmentAnswerSummary[];
  calculations: MeansAssessmentCalculations;
}
