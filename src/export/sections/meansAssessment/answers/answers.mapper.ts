import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type {
  Question,
  QuestionSection,
} from "#/export/sections/meansAssessment/answers/answers.types.js";
import type {
  MeansAssessmentAnswerSummary,
  MeansAssessmentAnswerSummaryRow,
} from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { formatAnswer } from "#/export/sections/meansAssessment/answers/answers.formatter.js";
import { clientQuestionSections } from "#/export/sections/meansAssessment/answers/client.mapper.js";
import { fixedT } from "#/lib/i18n.js";

const DISPLAY_INDEX_OFFSET = 1;
const means = {
  t: fixedT("pages.export.meansAssessment"),
};

/**
 * Maps saved CCQ answers independently of calculation availability.
 * @param answers Trusted answers from a finished CCQ journey, when saved.
 * @returns Ordered, translated answer summaries with no operational metadata.
 */
export function toMeansAssessmentAnswerSummaries(
  answers: EligibilityData | null | undefined,
): MeansAssessmentAnswerSummary[] {
  if (answers === null || answers === undefined) {
    return [];
  }

  return toQuestionSectionSummaries(answers, clientQuestionSections);
}

/**
 * Maps question sections while preserving order and saved answer-context indexes.
 * @template TAnswerContext Context provided to each question.
 * @param answers Trusted saved CCQ answers used for presentation gates.
 * @param sections Ordered sections and their answer contexts.
 * @returns Plain-text summaries for the relevant sections and questions.
 */
export function toQuestionSectionSummaries<TAnswerContext>(
  answers: EligibilityData,
  sections: ReadonlyArray<QuestionSection<TAnswerContext>>,
): MeansAssessmentAnswerSummary[] {
  const summaries: MeansAssessmentAnswerSummary[] = [];

  for (const section of sections) {
    if (!isSectionRelevant(section, answers)) {
      continue;
    }

    const answerContexts = section.answerContexts(answers);

    // One context can feed several questions; repeated contexts give each
    // question multiple answers. Preserve each context index for numbering.
    for (const [index, answerContext] of answerContexts.entries()) {
      summaries.push(
        summarizeAnswerContext(section, answers, answerContext, index),
      );
    }
  }

  return summaries;
}
/**
 * Formats one question for one answer context.
 * @param question Question definition to format.
 * @param answerContext Saved data used by the question.
 * @param index The unchanged answer-context index.
 * @returns The translated label and formatted answer.
 */
function formatQuestion<TAnswerContext>(
  question: Question<TAnswerContext>,
  answerContext: TAnswerContext,
  index: number,
): MeansAssessmentAnswerSummaryRow {
  return {
    key: means.t(question.label, { index: index + DISPLAY_INDEX_OFFSET }),
    value: formatAnswer<TAnswerContext>(question, answerContext, index),
  };
}

/**
 * Checks whether a question applies to an answer context.
 * @param question Question definition to check.
 * @param answers Complete saved assessment answers.
 * @param answerContext Saved data used by the question.
 * @param index The unchanged answer-context index.
 * @returns Whether the question should appear in the summary.
 */
function isQuestionRelevant<TAnswerContext>(
  question: Question<TAnswerContext>,
  answers: EligibilityData,
  answerContext: TAnswerContext,
  index: number,
): boolean {
  return question.relevant?.(answers, answerContext, index) ?? true;
}

/**
 * Checks whether a section applies to saved assessment answers.
 * @param section Question section to check.
 * @param answers Complete saved assessment answers.
 * @returns Whether the section should be included.
 */
function isSectionRelevant<TAnswerContext>(
  section: QuestionSection<TAnswerContext>,
  answers: EligibilityData,
): boolean {
  return section.relevant?.(answers) ?? true;
}

/**
 * Creates a section summary for one answer context.
 * @param section Section containing the questions.
 * @param answers Complete saved assessment answers.
 * @param answerContext Saved data used by the section's questions.
 * @param index The unchanged answer-context index.
 * @returns The section heading and relevant question answers.
 */
function summarizeAnswerContext<TAnswerContext>(
  section: QuestionSection<TAnswerContext>,
  answers: EligibilityData,
  answerContext: TAnswerContext,
  index: number,
): MeansAssessmentAnswerSummary {
  const rows: MeansAssessmentAnswerSummaryRow[] = [];

  for (const question of section.questions) {
    if (!isQuestionRelevant(question, answers, answerContext, index)) {
      continue;
    }

    rows.push(formatQuestion(question, answerContext, index));
  }

  return {
    heading: means.t(section.heading, { index: index + DISPLAY_INDEX_OFFSET }),
    rows,
  };
}
