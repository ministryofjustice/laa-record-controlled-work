import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";

import { incomeFrequencies } from "#/export/sections/meansAssessment/answers/questions/frequencies.js";
import {
  hasDependants,
  isIncomeAssessmentRelevant,
} from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";

export const dependantQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  {
    answerContexts: (answers: EligibilityData) => [answers],
    heading: "dependants.heading",
    isRelevant: isIncomeAssessmentRelevant,
    questions: [
      {
        kind: "boolean",
        label: "dependants.childDependants",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
        select: (answers: EligibilityData) => answers.child_dependants!,
      },
      {
        isRelevant: (answers: EligibilityData) =>
          answers.child_dependants === true,
        kind: "text",
        label: "dependants.childDependantsCount",

        select: (answers: EligibilityData) =>
          String(answers.child_dependants_count),
      },
      {
        kind: "boolean",
        label: "dependants.adultDependants",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
        select: (answers: EligibilityData) => answers.adult_dependants!,
      },
      {
        isRelevant: (answers: EligibilityData) =>
          answers.adult_dependants === true,
        kind: "text",
        label: "dependants.adultDependantsCount",

        select: (answers: EligibilityData) =>
          String(answers.adult_dependants_count),
      },
      {
        isRelevant: hasDependants,
        kind: "boolean",
        label: "dependants.getIncome",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
        select: (answers: EligibilityData) => answers.dependants_get_income!,
      },
    ],
  },
  {
    answerContexts: (answers: EligibilityData) =>
      answers.dependant_incomes?.map(() => answers) ?? [],
    heading: "dependants.income.heading",
    isRelevant: (answers: EligibilityData) =>
      isIncomeAssessmentRelevant(answers) &&
      hasDependants(answers) &&
      answers.dependants_get_income === true,
    questions: [
      {
        choices: incomeFrequencies,
        kind: "frequency",
        label: "dependants.income.frequency",
        select: (answers, index) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
          return answers.dependant_incomes![index].frequency!;
        },
      },
      {
        kind: "gbp",
        label: "dependants.income.amount",
        select: (answers, index) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
          return answers.dependant_incomes![index].amount!;
        },
      },
    ],
  },
];
