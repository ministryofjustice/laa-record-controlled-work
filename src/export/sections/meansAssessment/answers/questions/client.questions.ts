import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";

import { isMeansTested } from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";

export const clientQuestionSections: Array<QuestionSection<EligibilityData>> = [
  {
    answerContexts: (answers: EligibilityData) => [answers],
    heading: "client.heading",
    questions: [
      {
        choices: {
          over_60: "client.age.over60",
          standard: "client.age.standard",
          under_18: "client.age.under18",
        },
        kind: "choice",
        label: "client.age.label",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
        select: (answerContext: EligibilityData) => answerContext.client_age!,
      },
      {
        isRelevant: isMeansTested,
        kind: "boolean",
        label: "client.partner",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
        select: (answerContext: EligibilityData) => answerContext.partner!,
      },
      {
        isRelevant: isMeansTested,
        kind: "boolean",
        label: "client.passporting",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed saved answers.
        select: (answerContext: EligibilityData) => answerContext.passporting!,
      },
    ],
  },
];
