import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";

import {
  client,
  partner,
} from "#/export/sections/meansAssessment/answers/answers.selections.js";
import {
  isIncomeAssessmentRelevant,
  isMeansTested,
} from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";

const employmentStatuses = {
  in_work: "employment.statuses.inWork",
  unemployed: "employment.statuses.unemployed",
};

export const clientEmploymentQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  {
    answerContexts: (answers) => [answers],
    heading: "employment.client.heading",
    isRelevant: isIncomeAssessmentRelevant,
    questions: [
      {
        choices: employmentStatuses,
        kind: "choice",
        label: "employment.client.status",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
        select: (answers) => client.employmentStatus(answers)!,
      },
    ],
  },
];

export const partnerAgeQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  {
    answerContexts: (answers) => [answers],
    heading: "employment.partnerAge.heading",
    isRelevant: (answers) =>
      isMeansTested(answers) && partner.isPresent(answers),
    questions: [
      {
        kind: "boolean",
        label: "employment.partnerAge.label",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates the partner age answer.
        select: (answers) => answers.partner_over_60!,
      },
    ],
  },
];

export const partnerEmploymentQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  {
    answerContexts: (answers) => [answers],
    heading: "employment.partner.heading",
    isRelevant: (answers) =>
      isIncomeAssessmentRelevant(answers) && partner.isPresent(answers),
    questions: [
      {
        choices: employmentStatuses,
        kind: "choice",
        label: "employment.partner.status",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
        select: (answers) => partner.employmentStatus(answers)!,
      },
    ],
  },
];
