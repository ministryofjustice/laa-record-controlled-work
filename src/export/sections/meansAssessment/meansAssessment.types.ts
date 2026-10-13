import type { MeansAssessmentAnswerSummary } from "#/export/sections/meansAssessment/answers/answers.types.js";
import type { MeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.types.js";

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
