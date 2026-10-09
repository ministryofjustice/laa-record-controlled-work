import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";
import type {
  AnswerSelection,
  SavedEmploymentIncome,
} from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

import {
  client,
  partner,
} from "#/export/sections/meansAssessment/answers/answers.selections.js";
import { incomeFrequencies } from "#/export/sections/meansAssessment/answers/questions/frequencies.js";
import { isIncomeAssessmentRelevant } from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";

const incomeTypes = {
  employment: "income.types.employment",
  self_employment: "income.types.selfEmployment",
  statutory_pay: "income.types.statutoryPay",
};

/**
 * Selects one completed saved income entry by its unchanged index.
 * @param adult Explicit saved-answer selectors for the adult.
 * @param answers Trusted saved CCQ answers.
 * @param index The saved income index.
 * @returns The saved employment income entry.
 */
function getEmploymentIncome(
  adult: AnswerSelection,
  answers: EligibilityData,
  index: number,
): SavedEmploymentIncome {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed income entries.
  return adult.employmentIncomes(answers)![index];
}

/**
 * Creates one employment-income question group for an adult.
 * @param params Params
 * @param params.answer Explicit selectors for the client or partner.
 * @param params.labels Labels
 * @param params.labels.frequencyLabel Translation key for the income frequency label.
 * @param params.labels.heading Translation key for each repeated income heading.
 * @returns A question section preserving saved income indexes.
 */
function toIncomeQuestionSection(params: {
  answer: AnswerSelection;
  labels: { frequencyLabel: string; heading: string };
}): QuestionSection<EligibilityData> {
  const {
    answer,
    labels: { frequencyLabel, heading },
  } = params;
  return {
    answerContexts: (answers: EligibilityData) =>
      answer.employmentIncomes(answers)?.map(() => answers) ?? [],
    heading,
    isRelevant: (answers: EligibilityData) =>
      isIncomeAssessmentRelevant(answers) &&
      answer.isPresent(answers) &&
      answer.employmentStatus(answers) === "in_work",
    questions: [
      {
        choices: incomeTypes,
        kind: "choice",
        label: "income.incomeType",
        select: (answers, index) => {
          const income = getEmploymentIncome(answer, answers, index);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed income entries.
          return income.income_type!;
        },
      },
      {
        choices: incomeFrequencies,
        kind: "frequency",
        label: frequencyLabel,
        select: (answers, index) => {
          const income = getEmploymentIncome(answer, answers, index);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed income entries.
          return income.income_frequency!;
        },
      },
      {
        kind: "gbp",
        label: "income.grossIncome",
        select: (answers, index) => {
          const income = getEmploymentIncome(answer, answers, index);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed income entries.
          return income.gross_income!;
        },
      },
      {
        kind: "gbp",
        label: "income.incomeTax",
        select: (answers, index) => {
          const income = getEmploymentIncome(answer, answers, index);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed income entries.
          return income.income_tax!;
        },
      },
      {
        kind: "gbp",
        label: "income.nationalInsurance",
        select: (answers, index) => {
          const income = getEmploymentIncome(answer, answers, index);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed income entries.
          return income.national_insurance!;
        },
      },
    ],
  };
}

export const clientIncomeQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  toIncomeQuestionSection({
    answer: client,
    labels: {
      frequencyLabel: "income.client.frequency",
      heading: "income.client.entryHeading",
    },
  }),
];

export const partnerIncomeQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  toIncomeQuestionSection({
    answer: partner,
    labels: {
      frequencyLabel: "income.partner.frequency",
      heading: "income.partner.entryHeading",
    },
  }),
];
