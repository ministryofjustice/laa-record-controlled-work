import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";
import type {
  AnswerSelection,
  SavedBenefit,
} from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

import {
  client,
  partner,
} from "#/export/sections/meansAssessment/answers/answers.selections.js";
import { isIncomeAssessmentRelevant } from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";

const benefitFrequencies = {
  every_four_weeks: "benefits.frequencies.everyFourWeeks",
  every_two_weeks: "benefits.frequencies.everyTwoWeeks",
  every_week: "benefits.frequencies.everyWeek",
  monthly: "benefits.frequencies.monthly",
};

interface BenefitLabels {
  entryHeading: string;
  heading: string;
  receivesBenefits: string;
}

/**
 * Selects one completed saved benefit entry by its unchanged index.
 * @param adult Explicit saved-answer selectors for the adult.
 * @param answers Trusted saved CCQ answers.
 * @param index The saved benefit index.
 * @returns The saved benefit entry.
 */
function getBenefit(
  adult: AnswerSelection,
  answers: EligibilityData,
  index: number,
): SavedBenefit {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed benefit entries.
  return adult.benefits(answers)![index];
}

/**
 * Creates a saved benefit toggle and its repeated benefit summaries.
 * @param params Parameters
 * @param params.answers Explicit selectors for the client or partner.
 * @param params.labels Domain-local labels for that adult.
 * @returns Ordered toggle and repeated-entry question sections.
 */
function toBenefitSection(params: {
  answers: AnswerSelection;
  labels: BenefitLabels;
}): [QuestionSection<EligibilityData>, QuestionSection<EligibilityData>] {
  const { answers: adult, labels } = params;

  const isRelevant = (answers: EligibilityData): boolean =>
    isIncomeAssessmentRelevant(answers) && adult.isPresent(answers);

  return [
    {
      answerContexts: (answers: EligibilityData) => [answers],
      heading: labels.heading,
      isRelevant,
      questions: [
        {
          kind: "boolean",
          label: labels.receivesBenefits,
          select: (answers: EligibilityData) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed benefits answers.
            return adult.receivesBenefits(answers)!;
          },
        },
      ],
    },
    {
      answerContexts: (answers: EligibilityData) =>
        adult.benefits(answers)?.map(() => answers) ?? [],
      heading: labels.entryHeading,
      isRelevant: (answers: EligibilityData) =>
        isRelevant(answers) && adult.receivesBenefits(answers) === true,
      questions: [
        {
          kind: "text",
          label: "benefits.type",
          select: (answers, index) => {
            const benefit = getBenefit(adult, answers, index);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ preserves entered benefit names.
            return benefit.benefit_type!;
          },
        },
        {
          kind: "gbp",
          label: "benefits.amount",
          select: (answers, index) => {
            const benefit = getBenefit(adult, answers, index);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed benefit amounts.
            return benefit.benefit_amount!;
          },
        },
        {
          choices: benefitFrequencies,
          kind: "frequency",
          label: "benefits.frequency",
          select: (answers, index) => {
            const benefit = getBenefit(adult, answers, index);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed benefit frequencies.
            return benefit.benefit_frequency!;
          },
        },
      ],
    },
  ];
}

export const clientBenefitsQuestionSections = toBenefitSection({
  answers: client,
  labels: {
    entryHeading: "benefits.client.entryHeading",
    heading: "benefits.client.heading",
    receivesBenefits: "benefits.client.receivesBenefits",
  },
});

export const partnerBenefitsQuestionSections = toBenefitSection({
  answers: partner,
  labels: {
    entryHeading: "benefits.partner.entryHeading",
    heading: "benefits.partner.heading",
    receivesBenefits: "benefits.partner.receivesBenefits",
  },
});
