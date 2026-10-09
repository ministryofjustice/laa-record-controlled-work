import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type {
  Question,
  QuestionSection,
} from "#/export/sections/meansAssessment/answers/answers.types.js";
import type {
  AnswerSelection,
  OtherIncomeCategorySelectors,
} from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

import {
  client,
  partner,
} from "#/export/sections/meansAssessment/answers/answers.selections.js";
import { otherIncomeFrequencies } from "#/export/sections/meansAssessment/answers/questions/frequencies.js";
import { isIncomeAssessmentRelevant } from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";

interface OtherIncomeCategory {
  hasFrequency: boolean;
  label: string;
  selectors: OtherIncomeCategorySelectors;
}

/**
 * Declares the relevant rows for one other-income category.
 * @param category Saved selectors, relevance gate, and category label.
 * @returns The category toggle and conditional amount/frequency rows.
 */
function categoryQuestions(
  category: OtherIncomeCategory,
): Array<Question<EligibilityData>> {
  const questions: Array<Question<EligibilityData>> = [
    {
      kind: "boolean",
      label: category.label,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed relevance answers.
      select: (answers) => category.selectors.relevant(answers)!,
    },
    {
      isRelevant: (answers) => category.selectors.relevant(answers) === true,
      kind: "gbp",
      label: "otherIncome.amount",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates amounts when the category is relevant.
      select: (answers) => category.selectors.amount(answers)!,
    },
  ];

  if (category.hasFrequency) {
    questions.push({
      choices: otherIncomeFrequencies,
      isRelevant: (answers) => category.selectors.relevant(answers) === true,
      kind: "frequency",
      label: "otherIncome.frequency",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ saves frequencies for regular income categories.
      select: (answers) => category.selectors.frequency!(answers)!,
    });
  }

  return questions;
}

/**
 * Creates one ordered other-income summary for an assessment adult.
 * @param params Params
 * @param params.answer Explicit saved-answer selectors for the client or partner.
 * @param params.categories Ordered category declarations
 * @param params.heading Section heading
 * @returns The adult's other-income question section.
 */
function toOtherIncomeQuestionSection(params: {
  answer: AnswerSelection;
  categories: OtherIncomeCategory[];
  heading: string;
}): QuestionSection<EligibilityData> {
  const { answer, categories, heading } = params;

  return {
    answerContexts: (answers: EligibilityData) => [answers],
    heading,
    isRelevant: (answers: EligibilityData) =>
      isIncomeAssessmentRelevant(answers) && answer.isPresent(answers),
    questions: categories.flatMap(categoryQuestions),
  };
}

export const clientOtherIncomeQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  toOtherIncomeQuestionSection({
    answer: client,
    categories: [
      {
        hasFrequency: true,
        label: "otherIncome.client.friendsOrFamily",
        selectors: client.otherIncome.friendsOrFamily,
      },
      {
        hasFrequency: true,
        label: "otherIncome.client.maintenance",
        selectors: client.otherIncome.maintenance,
      },
      {
        hasFrequency: true,
        label: "otherIncome.client.propertyOrLodger",
        selectors: client.otherIncome.propertyOrLodger,
      },
      {
        hasFrequency: true,
        label: "otherIncome.client.pension",
        selectors: client.otherIncome.pension,
      },
      {
        hasFrequency: false,
        label: "otherIncome.client.studentFinance",
        selectors: client.otherIncome.studentFinance,
      },
      {
        hasFrequency: false,
        label: "otherIncome.client.other",
        selectors: client.otherIncome.other,
      },
    ],
    heading: "otherIncome.client.heading",
  }),
];

export const partnerOtherIncomeQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  toOtherIncomeQuestionSection({
    answer: partner,
    categories: [
      {
        hasFrequency: true,
        label: "otherIncome.partner.friendsOrFamily",
        selectors: partner.otherIncome.friendsOrFamily,
      },
      {
        hasFrequency: true,
        label: "otherIncome.partner.maintenance",
        selectors: partner.otherIncome.maintenance,
      },
      {
        hasFrequency: true,
        label: "otherIncome.partner.propertyOrLodger",
        selectors: partner.otherIncome.propertyOrLodger,
      },
      {
        hasFrequency: true,
        label: "otherIncome.partner.pension",
        selectors: partner.otherIncome.pension,
      },
      {
        hasFrequency: false,
        label: "otherIncome.partner.studentFinance",
        selectors: partner.otherIncome.studentFinance,
      },
      {
        hasFrequency: false,
        label: "otherIncome.partner.other",
        selectors: partner.otherIncome.other,
      },
    ],
    heading: "otherIncome.partner.heading",
  }),
];
