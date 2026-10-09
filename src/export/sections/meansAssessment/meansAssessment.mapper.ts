import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { MeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { toMeansAssessmentAnswerSummaries } from "#/export/sections/meansAssessment/answers/answers.mapper.js";
import { toMeansAssessmentCalculations } from "#/export/sections/meansAssessment/calculations/calculations.mapper.js";

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
