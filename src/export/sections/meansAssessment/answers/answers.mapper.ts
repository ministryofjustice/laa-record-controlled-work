import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type {
  MeansAssessmentAnswerSummary,
  MeansAssessmentAnswerSummaryCard,
  MeansAssessmentAnswerSummaryRow,
  Question,
  QuestionSection,
} from "#/export/sections/meansAssessment/answers/answers.types.js";

import { formatAnswer } from "#/export/sections/meansAssessment/answers/answers.formatter.js";
import { assetQuestionSections } from "#/export/sections/meansAssessment/answers/questions/assets.questions.js";
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
import { housingQuestionSections } from "#/export/sections/meansAssessment/answers/questions/housing.questions.js";
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
import { additionalPropertyQuestionSections } from "#/export/sections/meansAssessment/answers/questions/properties.questions.js";
import { fixedT } from "#/lib/i18n.js";

const DISPLAY_INDEX_OFFSET = 1;
const NO_ANSWER_CARDS = 0;
const means = {
  t: fixedT("pages.export.meansAssessment"),
};

interface AnswerSectionDefinition {
  cards: ReadonlyArray<QuestionSection<EligibilityData>>;
  heading: string;
}

const answerSections: readonly AnswerSectionDefinition[] = [
  { cards: clientQuestionSections, heading: "sections.clientDetails" },
  { cards: dependantQuestionSections, heading: "sections.dependants" },
  {
    cards: [
      ...clientEmploymentQuestionSections,
      ...clientIncomeQuestionSections,
      ...clientBenefitsQuestionSections,
      ...clientOtherIncomeQuestionSections,
    ],
    heading: "sections.clientIncome",
  },
  {
    cards: [
      ...partnerAgeQuestionSections,
      ...partnerEmploymentQuestionSections,
      ...partnerIncomeQuestionSections,
      ...partnerBenefitsQuestionSections,
      ...partnerOtherIncomeQuestionSections,
    ],
    heading: "sections.partnerIncome",
  },
  {
    cards: [
      ...clientOutgoingsQuestionSections,
      ...partnerOutgoingsQuestionSections,
    ],
    heading: "sections.outgoings",
  },
  {
    cards: [...housingQuestionSections, ...additionalPropertyQuestionSections],
    heading: "sections.housingAndProperty",
  },
  { cards: assetQuestionSections, heading: "sections.assets" },
];

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

  const summaries: MeansAssessmentAnswerSummary[] = [];
  for (const section of answerSections) {
    const cards = toQuestionSectionSummaries(answers, section.cards);
    if (cards.length > NO_ANSWER_CARDS) {
      summaries.push({ cards, heading: means.t(section.heading) });
    }
  }

  return summaries;
}

/**
 * Creates a card summary for one answer context.
 * @param section Card containing the questions.
 * @param answers Complete saved assessment answers.
 * @param answerContext Saved data used by the card's questions.
 * @param index The unchanged answer-context index.
 * @returns The card heading and relevant question answers, or null when empty.
 */
function toAnswerSummary<TAnswerContext>(
  section: QuestionSection<TAnswerContext>,
  answers: EligibilityData,
  answerContext: TAnswerContext,
  index: number,
): MeansAssessmentAnswerSummaryCard | null {
  const rows: MeansAssessmentAnswerSummaryRow[] = [];

  for (const question of section.questions) {
    if (question.isRelevant?.(answers, answerContext, index) === false) {
      continue;
    }

    rows.push(toAnswerSummaryRow(question, answers, answerContext, index));
  }

  if (rows.length === NO_ANSWER_CARDS) {
    return null;
  }

  return {
    heading: means.t(section.heading, { index: index + DISPLAY_INDEX_OFFSET }),
    rows,
  };
}

/**
 * Formats one question for one answer context.
 * @param question Question definition to format.
 * @param answers Complete saved assessment answers.
 * @param answerContext Saved data used by the question.
 * @param index The unchanged answer-context index.
 * @returns The translated label and formatted answer.
 */
function toAnswerSummaryRow<TAnswerContext>(
  question: Question<TAnswerContext>,
  answers: EligibilityData,
  answerContext: TAnswerContext,
  index: number,
): MeansAssessmentAnswerSummaryRow {
  const label =
    typeof question.label === "string"
      ? question.label
      : question.label(answers, answerContext, index);

  return {
    key: means.t(label, { index: index + DISPLAY_INDEX_OFFSET }),
    value: formatAnswer<TAnswerContext>(question, answerContext, index),
  };
}

/**
 * Maps question cards while preserving order and saved answer-context indexes.
 * @template TAnswerContext Context provided to each card.
 * @param answers Trusted saved CCQ answers used for presentation gates.
 * @param sections Ordered cards and their answer contexts.
 * @returns Plain-text cards for relevant questions.
 */
function toQuestionSectionSummaries<TAnswerContext>(
  answers: EligibilityData,
  sections: ReadonlyArray<QuestionSection<TAnswerContext>>,
): MeansAssessmentAnswerSummaryCard[] {
  const summaries: MeansAssessmentAnswerSummaryCard[] = [];

  for (const section of sections) {
    if (section.isRelevant?.(answers) === false) {
      continue;
    }

    const answerContexts: readonly TAnswerContext[] =
      section.answerContexts(answers);

    // One context can feed several questions; repeated contexts give each
    // question multiple answers. Preserve each context index for numbering.
    for (const [index, answerContext] of answerContexts.entries()) {
      const summary = toAnswerSummary(section, answers, answerContext, index);
      if (summary !== null) {
        summaries.push(summary);
      }
    }
  }

  return summaries;
}
