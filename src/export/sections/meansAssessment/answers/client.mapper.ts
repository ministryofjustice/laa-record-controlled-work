import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
/* eslint @typescript-eslint/no-non-null-assertion: "off" -- CCQ validates completed saved answers. */
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";

import { isMeansTested } from "#/export/sections/meansAssessment/answers/answers.relevance.js";

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
        select: (answerContext) => answerContext.client_age!,
      },
      {
        isRelevant: isMeansTested,
        kind: "boolean",
        label: "client.partner",
        select: (answerContext) => answerContext.partner!,
      },
      {
        isRelevant: isMeansTested,
        kind: "boolean",
        label: "client.passporting",
        select: (answerContext) => answerContext.passporting!,
      },
    ],
  },
];
