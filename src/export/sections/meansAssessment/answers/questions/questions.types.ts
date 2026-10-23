export enum PropertyOwnership {
  None = "none",
  Outright = "outright",
  SharedOwnership = "shared_ownership",
  WithMortgage = "with_mortgage",
}

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { EligibilityDataBankAccount } from "#/api/clients/rcw/model/eligibilityDataBankAccount.zod.gen.js";
import type { EligibilityDataBenefit } from "#/api/clients/rcw/model/eligibilityDataBenefit.zod.gen.js";
import type { EligibilityDataIncome } from "#/api/clients/rcw/model/eligibilityDataIncome.zod.gen.js";
import type { EligibilityDataProperty } from "#/api/clients/rcw/model/eligibilityDataProperty.zod.gen.js";

export interface AnswerSelection {
  additionalProperties: SavedAdditionalPropertiesSelector;
  additionalPropertyOwned: SavedStringSelector;
  assets: AssetAnswerSelectors;
  benefits: SavedBenefitsSelector;
  employmentIncomes: SavedEmploymentIncomesSelector;
  employmentStatus: SavedNullableStringSelector;
  isDisputeApplicable: SavedBooleanSelector;
  isPresent: SavedBooleanSelector;
  otherIncome: OtherIncomeSelectorsByCategory;
  payments: PaymentAnswerSelectorsByType;
  receivesBenefits: SavedNullableBooleanSelector;
}
export interface AssetAnswerSelectors {
  bankAccounts: SavedBankAccountsSelector;
  investments: AssetValueSelectors;
  valuables: AssetValueSelectors;
}
export type SavedNullableBooleanSelector = (
  answers: EligibilityData,
) => boolean | null | undefined;

interface AssetValueSelectors {
  amount: SavedNullableNumberSelector;
  disputed: SavedNullableBooleanSelector;
  relevant: SavedNullableBooleanSelector;
}

type SavedAdditionalPropertiesSelector = (
  answers: EligibilityData,
) => readonly EligibilityDataProperty[];

type SavedBankAccountsSelector = (
  answers: EligibilityData,
) => EligibilityDataBankAccount[] | null | undefined;

type SavedBenefitsSelector = (
  answers: EligibilityData,
) => EligibilityDataBenefit[] | null | undefined;

type SavedBooleanSelector = (answers: EligibilityData) => boolean;

type SavedEmploymentIncomesSelector = (
  answers: EligibilityData,
) => EligibilityDataIncome[] | null | undefined;

type SavedNullableNumberSelector = (
  answers: EligibilityData,
) => null | number | undefined;

type SavedNullableStringSelector = (
  answers: EligibilityData,
) => null | string | undefined;

type SavedStringSelector = (answers: EligibilityData) => string;

export const propertyOwnershipChoices = {
  none: "housing.property.ownership.none",
  outright: "housing.property.ownership.outright",
  shared_ownership: "housing.property.ownership.sharedOwnership",
  with_mortgage: "housing.property.ownership.withMortgage",
};

export interface OtherIncomeCategorySelectors {
  amount: SavedNullableNumberSelector;
  frequency?: SavedNullableStringSelector;
  relevant: SavedNullableBooleanSelector;
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
  amount: SavedNullableNumberSelector;
  frequency: SavedNullableStringSelector;
  relevant: SavedNullableBooleanSelector;
}

export interface PaymentAnswerSelectorsByType {
  childcare: PaymentAnswerSelectors;
  legalAid: PaymentAnswerSelectors;
  maintenance: PaymentAnswerSelectors;
}
