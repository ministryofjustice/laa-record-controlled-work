import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";

import { ClientAgeRange } from "#/api/eligibility/eligibility.types.js";

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

/**
 * Determines whether saved route selectors show means-tested answers.
 * @param answers Trusted saved CCQ answers.
 * @returns Whether applicant answers are relevant for presentation.
 */
function isMeansTested(answers: EligibilityData): boolean {
  const underEighteen = answers.client_age === ClientAgeRange.Under18;
  const controlledClr =
    underEighteen &&
    answers.level_of_help === "controlled" &&
    answers.controlled_legal_representation === true;
  const noIncomeOrAssets =
    underEighteen &&
    answers.aggregated_means === false &&
    answers.regular_income === false &&
    answers.under_eighteen_assets === false;
  const asylumSupported =
    answers.immigration_or_asylum === true && answers.asylum_support === true;

  return !controlledClr && !noIncomeOrAssets && !asylumSupported;
}
