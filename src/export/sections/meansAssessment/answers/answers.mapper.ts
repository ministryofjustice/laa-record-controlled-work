import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type {
  MeansAssessmentAnswerSummary,
  MeansAssessmentAnswerSummaryRow,
  Question,
  QuestionSection,
} from "#/export/sections/meansAssessment/answers/answers.types.js";

import { formatAnswer } from "#/export/sections/meansAssessment/answers/answers.formatter.js";
import {
  clientBenefitsQuestionSections,
  partnerBenefitsQuestionSections,
} from "#/export/sections/meansAssessment/answers/questions/benefits.questions.js";
import { clientQuestionSections } from "#/export/sections/meansAssessment/answers/questions/client.questions.js";
import { dependantQuestionSections } from "#/export/sections/meansAssessment/answers/questions/dependants.questions.js";
import {
  clientEmploymentQuestionSections,
  partnerAgeQuestionSections,
  partnerEmploymentQuestionSections,
} from "#/export/sections/meansAssessment/answers/questions/employment.questions.js";
import {
  clientIncomeQuestionSections,
  partnerIncomeQuestionSections,
} from "#/export/sections/meansAssessment/answers/questions/income.questions.js";
import {
  clientOtherIncomeQuestionSections,
  partnerOtherIncomeQuestionSections,
} from "#/export/sections/meansAssessment/answers/questions/otherIncome.questions.js";
import {
  clientOutgoingsQuestionSections,
  partnerOutgoingsQuestionSections,
} from "#/export/sections/meansAssessment/answers/questions/outgoings.questions.js";
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

  return toQuestionSectionSummaries<EligibilityData>(answers, [
    ...clientQuestionSections,
    ...dependantQuestionSections,
    ...clientEmploymentQuestionSections,
    ...clientIncomeQuestionSections,
    ...clientBenefitsQuestionSections,
    ...clientOtherIncomeQuestionSections,
    ...partnerAgeQuestionSections,
    ...partnerEmploymentQuestionSections,
    ...partnerIncomeQuestionSections,
    ...partnerBenefitsQuestionSections,
    ...partnerOtherIncomeQuestionSections,
    ...clientOutgoingsQuestionSections,
    ...partnerOutgoingsQuestionSections,
  ]);
}

/**
 * Creates a section summary for one answer context.
 * @param section Section containing the questions.
 * @param answers Complete saved assessment answers.
 * @param answerContext Saved data used by the section's questions.
 * @param index The unchanged answer-context index.
 * @returns The section heading and relevant question answers.
 */
function toAnswerSummary<TAnswerContext>(
  section: QuestionSection<TAnswerContext>,
  answers: EligibilityData,
  answerContext: TAnswerContext,
  index: number,
): MeansAssessmentAnswerSummary {
  const rows: MeansAssessmentAnswerSummaryRow[] = [];

  for (const question of section.questions) {
    if (question.isRelevant?.(answers, answerContext, index) === false) {
      continue;
    }

    rows.push(
      toAnswerSummaryRow<TAnswerContext>(question, answerContext, index),
    );
  }

  return {
    heading: means.t(section.heading, { index: index + DISPLAY_INDEX_OFFSET }),
    rows,
  };
}
/**
 * Formats one question for one answer context.
 * @param question Question definition to format.
 * @param answerContext Saved data used by the question.
 * @param index The unchanged answer-context index.
 * @returns The translated label and formatted answer.
 */
function toAnswerSummaryRow<TAnswerContext>(
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
 * Maps question sections while preserving order and saved answer-context indexes.
 * @template TAnswerContext Context provided to each question.
 * @param answers Trusted saved CCQ answers used for presentation gates.
 * @param sections Ordered sections and their answer contexts.
 * @returns Plain-text summaries for the relevant sections and questions.
 */
function toQuestionSectionSummaries<TAnswerContext>(
  answers: EligibilityData,
  sections: ReadonlyArray<QuestionSection<TAnswerContext>>,
): MeansAssessmentAnswerSummary[] {
  const summaries: MeansAssessmentAnswerSummary[] = [];

  for (const section of sections) {
    if (section.isRelevant?.(answers) === false) {
      continue;
    }

    const answerContexts: readonly TAnswerContext[] =
      section.answerContexts(answers);

    // One context can feed several questions; repeated contexts give each
    // question multiple answers. Preserve each context index for numbering.
    for (const [index, answerContext] of answerContexts.entries()) {
      summaries.push(
        toAnswerSummary<TAnswerContext>(section, answers, answerContext, index),
      );
    }
  }

  return summaries;
}
