export enum MeansAssessmentStatus {
  Calculated = "calculated",
  NotCalculated = "not_calculated",
  Ready = "ready",
  Unavailable = "unavailable",
}

export enum MeansAssessmentTotalField {
  CombinedAssessedCapital = "combined_assessed_capital",
  CombinedTotalDisposableIncome = "combined_total_disposable_income",
  CombinedTotalGrossIncome = "combined_total_gross_income",
}

export type MeansAssessmentCalculations =
  | {
      capital: MeansAssessmentCategory;
      capitalContribution: null | number;
      disposableIncome: MeansAssessmentCategory;
      grossIncome: MeansAssessmentCategory;
      incomeContribution: null | number;
      outcome: MeansAssessmentOutcome;
      status: MeansAssessmentStatus.Ready;
    }
  | { status: MeansAssessmentStatus.Unavailable };

export type MeansAssessmentCategory =
  | {
      noUpperThreshold: boolean;
      outcome: MeansAssessmentCategoryOutcome;
      status: MeansAssessmentStatus.Calculated;
      total: number;
      upperThreshold: number;
    }
  | { status: MeansAssessmentStatus.NotCalculated };

export type MeansAssessmentCategoryOutcome =
  "contribution_required" | "eligible" | "ineligible";

export type MeansAssessmentCategorySet = [
  capital: MeansAssessmentCategory,
  disposableIncome: MeansAssessmentCategory,
  grossIncome: MeansAssessmentCategory,
];

export type MeansAssessmentOutcome = "contribution_required" | "eligible";
