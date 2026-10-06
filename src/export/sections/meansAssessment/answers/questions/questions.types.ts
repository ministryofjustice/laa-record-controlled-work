export interface AnswerSelection {
  benefits: (answers: EligibilityData) => EligibilityData["benefits"];
  employmentIncomes: (answers: EligibilityData) => EligibilityData["incomes"];
  employmentStatus: (answers: EligibilityData) => null | string | undefined;
  isPresent: (answers: EligibilityData) => boolean;
  otherIncome: OtherIncomeSelectorsByCategory;
  receivesBenefits: (answers: EligibilityData) => boolean | null | undefined;
}

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

export interface OtherIncomeCategorySelectors {
  amount: (answers: EligibilityData) => null | number | undefined;
  frequency?: (answers: EligibilityData) => null | string | undefined;
  relevant: (answers: EligibilityData) => boolean | null | undefined;
}

export interface OtherIncomeSelectorsByCategory {
  friendsOrFamily: OtherIncomeCategorySelectors;
  maintenance: OtherIncomeCategorySelectors;
  other: OtherIncomeCategorySelectors;
  pension: OtherIncomeCategorySelectors;
  propertyOrLodger: OtherIncomeCategorySelectors;
  studentFinance: OtherIncomeCategorySelectors;
}

export type SavedBenefit = NonNullable<EligibilityData["benefits"]>[number];

export type SavedEmploymentIncome = NonNullable<
  EligibilityData["incomes"]
>[number];
