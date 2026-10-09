import type { MeansAssessmentAnswerSummary } from "#/export/sections/meansAssessment/answers/answers.types.js";
import type { MeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.types.js";

export interface MeansAssessmentSection {
  answerSummaries: MeansAssessmentAnswerSummary[];
  calculations: MeansAssessmentCalculations;
}
