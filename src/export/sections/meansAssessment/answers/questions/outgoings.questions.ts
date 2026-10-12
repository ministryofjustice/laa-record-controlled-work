import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type {
  Question,
  QuestionSection,
} from "#/export/sections/meansAssessment/answers/answers.types.js";
import type {
  AnswerSelection,
  PaymentAnswerSelectors,
} from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

import {
  client,
  partner,
} from "#/export/sections/meansAssessment/answers/answers.selections.js";
import { paymentFrequencies } from "#/export/sections/meansAssessment/answers/questions/frequencies.js";
import { isIncomeAssessmentRelevant } from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";

interface OutgoingsLabels {
  childcare: string;
  heading: string;
  legalAid: string;
  maintenance: string;
}

interface PaymentQuestion {
  isAvailable: (answers: EligibilityData) => boolean;
  label: string;
  selectors: PaymentAnswerSelectors;
}

/**
 * Determines whether every adult in the household qualifies for childcare costs, using the same derived logic as CCQ
 * @param answers Trusted saved CCQ answers.
 * @returns Whether childcare questions were available in the saved journey.
 */
function isChildcareAvailable(answers: EligibilityData): boolean {
  return (
    answers.child_dependants === true &&
    qualifiesForChildcare(answers, client) &&
    (!partner.isPresent(answers) || qualifiesForChildcare(answers, partner))
  );
}

/**
 * Declares one payment toggle and its conditional amount and frequency.
 * @param payment Saved selectors, label, and presentation availability.
 * @returns Ordered summary questions for this payment.
 */
function paymentQuestions(
  payment: PaymentQuestion,
): Array<Question<EligibilityData>> {
  const isRelevant = (answers: EligibilityData): boolean =>
    payment.isAvailable(answers) &&
    payment.selectors.relevant(answers) === true;

  return [
    {
      isRelevant: (answers) => payment.isAvailable(answers),
      kind: "boolean",
      label: payment.label,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed payment answers.
      select: (answers) => payment.selectors.relevant(answers)!,
    },
    {
      isRelevant,
      kind: "gbp",
      label: "outgoings.amount",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates amounts for enabled payments.
      select: (answers) => payment.selectors.amount(answers)!,
    },
    {
      choices: paymentFrequencies,
      isRelevant,
      kind: "frequency",
      label: "outgoings.frequency",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates frequencies for enabled payments.
      select: (answers) => payment.selectors.frequency(answers)!,
    },
  ];
}

/**
 * Checks an adult's saved income or student-finance childcare qualification.
 * @param answers Trusted saved CCQ answers.
 * @param answer Explicit client or partner answer selectors.
 * @returns Whether the adult has a qualifying income source.
 */
function qualifiesForChildcare(
  answers: EligibilityData,
  answer: AnswerSelection,
): boolean {
  return (
    answer.otherIncome.studentFinance.relevant(answers) === true ||
    answer
      .employmentIncomes(answers)
      ?.some((income) => income.income_type !== "statutory_pay") === true
  );
}

/**
 * Creates the ordered outgoing payment summary for one assessment.
 * @param params Parameters for this adult's summary.
 * @param params.answer Explicit client or partner answer selectors.
 * @param params.labels Domain-local translated labels.
 * @returns Outgoing payment question section.
 */
function toOutgoingsQuestionSection(params: {
  answer: AnswerSelection;
  labels: OutgoingsLabels;
}): QuestionSection<EligibilityData> {
  const { answer, labels } = params;

  return {
    answerContexts: (answers: EligibilityData) => [answers],
    heading: labels.heading,
    isRelevant: (answers: EligibilityData) =>
      isIncomeAssessmentRelevant(answers) && answer.isPresent(answers),
    questions: [
      ...paymentQuestions({
        isAvailable: isChildcareAvailable,
        label: labels.childcare,
        selectors: answer.payments.childcare,
      }),
      ...paymentQuestions({
        isAvailable: () => true,
        label: labels.maintenance,
        selectors: answer.payments.maintenance,
      }),
      ...paymentQuestions({
        isAvailable: () => true,
        label: labels.legalAid,
        selectors: answer.payments.legalAid,
      }),
    ],
  };
}

export const clientOutgoingsQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  toOutgoingsQuestionSection({
    answer: client,
    labels: {
      childcare: "outgoings.client.childcare",
      heading: "outgoings.client.heading",
      legalAid: "outgoings.client.legalAid",
      maintenance: "outgoings.client.maintenance",
    },
  }),
];

export const partnerOutgoingsQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [
  toOutgoingsQuestionSection({
    answer: partner,
    labels: {
      childcare: "outgoings.partner.childcare",
      heading: "outgoings.partner.heading",
      legalAid: "outgoings.partner.legalAid",
      maintenance: "outgoings.partner.maintenance",
    },
  }),
];
