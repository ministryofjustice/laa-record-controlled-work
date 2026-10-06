export enum PropertyOwnership {
  None = "none",
  Outright = "outright",
  SharedOwnership = "shared_ownership",
  WithMortgage = "with_mortgage",
}

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

export interface AnswerSelection {
  additionalProperties: (
    answers: EligibilityData,
  ) => readonly SavedAdditionalProperty[];
  additionalPropertyOwned: (answers: EligibilityData) => string;
  benefits: (answers: EligibilityData) => EligibilityData["benefits"];
  employmentIncomes: (answers: EligibilityData) => EligibilityData["incomes"];
  employmentStatus: (answers: EligibilityData) => null | string | undefined;
  isDisputeApplicable: (answers: EligibilityData) => boolean;
  isPresent: (answers: EligibilityData) => boolean;
  otherIncome: OtherIncomeSelectorsByCategory;
  payments: PaymentAnswerSelectorsByType;
  receivesBenefits: (answers: EligibilityData) => boolean | null | undefined;
}

export const propertyOwnershipChoices = {
  none: "housing.property.ownership.none",
  outright: "housing.property.ownership.outright",
  shared_ownership: "housing.property.ownership.sharedOwnership",
  with_mortgage: "housing.property.ownership.withMortgage",
};

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

export interface PaymentAnswerSelectors {
  amount: (answers: EligibilityData) => null | number | undefined;
  frequency: (answers: EligibilityData) => null | string | undefined;
  relevant: (answers: EligibilityData) => boolean | null | undefined;
}

export interface PaymentAnswerSelectorsByType {
  childcare: PaymentAnswerSelectors;
  legalAid: PaymentAnswerSelectors;
  maintenance: PaymentAnswerSelectors;
}

export type SavedAdditionalProperty = NonNullable<
  EligibilityData["additional_properties"]
>[number];

export type SavedBenefit = NonNullable<EligibilityData["benefits"]>[number];

export type SavedEmploymentIncome = NonNullable<
  EligibilityData["incomes"]
>[number];
