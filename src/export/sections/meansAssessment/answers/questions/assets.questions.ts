import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { EligibilityDataBankAccount } from "#/api/clients/rcw/model/eligibilityDataBankAccount.zod.gen.js";
import type {
  Question,
  QuestionSection,
} from "#/export/sections/meansAssessment/answers/answers.types.js";
import type {
  AnswerSelection,
  SavedNullableBooleanSelector,
} from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

import {
  client,
  partner,
} from "#/export/sections/meansAssessment/answers/answers.selections.js";
import { isMeansTested } from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";

interface AssetQuestionLabels {
  bankAccountHeading: string;
  heading: string;
  investmentsRelevant: string;
  valuablesRelevant: string;
}

/**
 * Declares a disputed-asset annotation behind its saved relevance controls.
 * @param answer Typed selectors for the client or partner.
 * @param isAssetRelevant Saved toggle for this asset category.
 * @param isDisputed Saved dispute marker for this asset category.
 * @returns The dispute annotation question.
 */
function disputedAssetQuestion(
  answer: AnswerSelection,
  isAssetRelevant: SavedNullableBooleanSelector,
  isDisputed: SavedNullableBooleanSelector,
): Question<EligibilityData> {
  return {
    isRelevant: (answers) =>
      answer.isDisputeApplicable(answers) &&
      isAssetRelevant(answers) === true &&
      isDisputed(answers) === true,
    kind: "boolean",
    label: "assets.disputedAsset",
    select: (answers) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ persists applicable dispute markers.
      return isDisputed(answers)!;
    },
  };
}

/**
 * Selects one completed bank-account entry by its unchanged index.
 * @param answer Typed selectors for the client or partner.
 * @param answers Complete saved assessment answers.
 * @param index Saved bank-account index.
 * @returns The saved account at that index.
 */
function getBankAccount(
  answer: AnswerSelection,
  answers: EligibilityData,
  index: number,
): EligibilityDataBankAccount {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Each rendered context comes from a saved bank-account entry.
  return answer.assets.bankAccounts(answers)![index];
}

/**
 * Creates ordered account and asset summaries for one adult.
 * @param params Configuration for the adult's asset summaries.
 * @param params.answer Saved-answer selectors for the adult.
 * @param params.labels Translated labels for the summaries.
 * @returns Bank-account entries followed by investments and valuables.
 */
function toAssetQuestionSections(params: {
  answer: AnswerSelection;
  labels: AssetQuestionLabels;
}): Array<QuestionSection<EligibilityData>> {
  const { answer, labels } = params;
  const isRelevant = (answers: EligibilityData): boolean =>
    isMeansTested(answers) && answer.isPresent(answers);

  const bankAccountsSection: QuestionSection<EligibilityData> = {
    answerContexts: (answers) =>
      answer.assets.bankAccounts(answers)?.map(() => answers) ?? [],
    heading: labels.bankAccountHeading,
    isRelevant,
    questions: [
      {
        kind: "gbp",
        label: "assets.bankAccountAmount",
        select: (answers, index) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed bank-account entries.
          getBankAccount(answer, answers, index).amount!,
      },
      {
        isRelevant: (answers, _context, index) =>
          answer.isDisputeApplicable(answers) &&
          getBankAccount(answer, answers, index).account_in_dispute === true,
        kind: "boolean",
        label: "assets.disputedAsset",
        select: (answers, index) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ persists applicable dispute markers.
          getBankAccount(answer, answers, index).account_in_dispute!,
      },
    ],
  };

  const assetsSection: QuestionSection<EligibilityData> = {
    answerContexts: (answers) => [answers],
    heading: labels.heading,
    isRelevant,
    questions: [
      {
        kind: "boolean",
        label: labels.investmentsRelevant,
        select: (answers) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed asset answers.
          answer.assets.investments.relevant(answers)!,
      },
      {
        isRelevant: (answers) =>
          answer.assets.investments.relevant(answers) === true,
        kind: "gbp",
        label: "assets.investments",
        select: (answers) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates enabled investment amounts.
          answer.assets.investments.amount(answers)!,
      },
      disputedAssetQuestion(
        answer,
        answer.assets.investments.relevant,
        answer.assets.investments.disputed,
      ),
      {
        kind: "boolean",
        label: labels.valuablesRelevant,
        select: (answers) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed asset answers.
          answer.assets.valuables.relevant(answers)!,
      },
      {
        isRelevant: (answers) =>
          answer.assets.valuables.relevant(answers) === true,
        kind: "gbp",
        label: "assets.valuables",
        select: (answers) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates enabled valuable-item amounts.
          answer.assets.valuables.amount(answers)!,
      },
      disputedAssetQuestion(
        answer,
        answer.assets.valuables.relevant,
        answer.assets.valuables.disputed,
      ),
    ],
  };

  return [bankAccountsSection, assetsSection];
}

const clientAssetQuestionSections = toAssetQuestionSections({
  answer: client,
  labels: {
    bankAccountHeading: "assets.client.bankAccountHeading",
    heading: "assets.client.heading",
    investmentsRelevant: "assets.client.investmentsRelevant",
    valuablesRelevant: "assets.client.valuablesRelevant",
  },
});

const partnerAssetQuestionSections = toAssetQuestionSections({
  answer: partner,
  labels: {
    bankAccountHeading: "assets.partner.bankAccountHeading",
    heading: "assets.partner.heading",
    investmentsRelevant: "assets.partner.investmentsRelevant",
    valuablesRelevant: "assets.partner.valuablesRelevant",
  },
});

export const assetQuestionSections: Array<QuestionSection<EligibilityData>> = [
  ...clientAssetQuestionSections,
  ...partnerAssetQuestionSections,
];
