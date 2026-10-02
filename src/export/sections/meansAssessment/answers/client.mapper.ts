/* eslint @typescript-eslint/no-non-null-assertion: "off" -- CCQ validates completed saved answers. */
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";

import { isMeansTested } from "#/export/sections/meansAssessment/answers/answers.relevance.js";

export const clientQuestionSections = [
  {
    answerContexts: (answers) => [answers],
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
        kind: "boolean",
        label: "client.partner",
        relevant: isMeansTested,
        select: (answerContext) => answerContext.partner!,
      },
      {
        kind: "boolean",
        label: "client.passporting",
        relevant: isMeansTested,
        select: (answerContext) => answerContext.passporting!,
      },
    ],
  },
] satisfies QuestionSection[];
