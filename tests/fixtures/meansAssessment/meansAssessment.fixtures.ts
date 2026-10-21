import type { MeansAssessmentScenario } from "#tests/fixtures/meansAssessment/builders.js";

import {
  createEmployedHouseholdScenario,
  createFormattingVariantsScenario,
  createHousingMortgageScenario,
  createHousingSharedOwnershipScenario,
  createOtherIncomeAndOutgoingsScenario,
  createPropertiesAndAssetsScenario,
  createStaleInactiveAnswersScenario,
} from "#tests/fixtures/meansAssessment/answers.fixtures.js";
import { createMeansAssessment } from "#tests/fixtures/meansAssessment/builders.js";
import {
  createCapitalPropertiesScenario,
  createUnavailableCapitalPropertiesScenario,
  createUncalculatedCapitalScenario,
} from "#tests/fixtures/meansAssessment/calculations/capital.fixtures.js";
import {
  createIncomeCalculationScenario,
  createPartnerIncomeCalculationScenario,
  createUnavailableIncomeCalculationScenario,
  createUncalculatedIncomeScenario,
} from "#tests/fixtures/meansAssessment/calculations/income.fixtures.js";
import {
  createOutgoingsCalculationScenario,
  createPartnerOutgoingsCalculationScenario,
  createUnavailableOutgoingsCalculationScenario,
  createUncalculatedOutgoingsScenario,
} from "#tests/fixtures/meansAssessment/calculations/outgoings.fixtures.js";
import {
  createAsylumSupportScenario,
  createCalculationStatesScenario,
  createMeansAssessmentNotRequiredScenario,
  createMissingEligibilityScenario,
  createPassportingScenario,
  createUnavailableResultScenario,
  createUnder18ControlledClrScenario,
  createUnder18NoMeansScenario,
} from "#tests/fixtures/meansAssessment/outcomes.fixtures.js";

export type { MeansAssessmentScenario } from "#tests/fixtures/meansAssessment/builders.js";

export enum MeansAssessmentScenarioName {
  AsylumSupport = "asylumSupport",
  Baseline = "baseline",
  CalculationStates = "calculationStates",
  CapitalPropertiesNotCalculated = "capitalPropertiesNotCalculated",
  CapitalPropertiesReady = "capitalPropertiesReady",
  CapitalPropertiesUnavailable = "capitalPropertiesUnavailable",
  EmployedHousehold = "employedHousehold",
  FormattingVariants = "formattingVariants",
  HousingMortgage = "housingMortgage",
  HousingSharedOwnership = "housingSharedOwnership",
  IncomeBreakdownNotCalculated = "incomeBreakdownNotCalculated",
  IncomeBreakdownPartner = "incomeBreakdownPartner",
  IncomeBreakdownReady = "incomeBreakdownReady",
  IncomeBreakdownUnavailable = "incomeBreakdownUnavailable",
  MeansAssessmentNotRequired = "meansAssessmentNotRequired",
  MissingEligibility = "missingEligibility",
  OtherIncomeAndOutgoings = "otherIncomeAndOutgoings",
  OutgoingsBreakdownNotCalculated = "outgoingsBreakdownNotCalculated",
  OutgoingsBreakdownPartner = "outgoingsBreakdownPartner",
  OutgoingsBreakdownReady = "outgoingsBreakdownReady",
  OutgoingsBreakdownUnavailable = "outgoingsBreakdownUnavailable",
  Passporting = "passporting",
  PropertiesAndAssets = "propertiesAndAssets",
  StaleInactiveAnswers = "staleInactiveAnswers",
  UnavailableResult = "unavailableResult",
  Under18ControlledClr = "under18ControlledClr",
  Under18NoMeans = "under18NoMeans",
}

export const meansAssessmentScenarios: Record<
  MeansAssessmentScenarioName,
  () => MeansAssessmentScenario
> = {
  [MeansAssessmentScenarioName.AsylumSupport]: createAsylumSupportScenario,
  [MeansAssessmentScenarioName.Baseline]: () => createMeansAssessment(),
  [MeansAssessmentScenarioName.CalculationStates]:
    createCalculationStatesScenario,
  [MeansAssessmentScenarioName.CapitalPropertiesNotCalculated]:
    createUncalculatedCapitalScenario,
  [MeansAssessmentScenarioName.CapitalPropertiesReady]:
    createCapitalPropertiesScenario,
  [MeansAssessmentScenarioName.CapitalPropertiesUnavailable]:
    createUnavailableCapitalPropertiesScenario,
  [MeansAssessmentScenarioName.EmployedHousehold]:
    createEmployedHouseholdScenario,
  [MeansAssessmentScenarioName.FormattingVariants]:
    createFormattingVariantsScenario,
  [MeansAssessmentScenarioName.HousingMortgage]: createHousingMortgageScenario,
  [MeansAssessmentScenarioName.HousingSharedOwnership]:
    createHousingSharedOwnershipScenario,
  [MeansAssessmentScenarioName.IncomeBreakdownNotCalculated]:
    createUncalculatedIncomeScenario,
  [MeansAssessmentScenarioName.IncomeBreakdownPartner]:
    createPartnerIncomeCalculationScenario,
  [MeansAssessmentScenarioName.IncomeBreakdownReady]:
    createIncomeCalculationScenario,
  [MeansAssessmentScenarioName.IncomeBreakdownUnavailable]:
    createUnavailableIncomeCalculationScenario,
  [MeansAssessmentScenarioName.MeansAssessmentNotRequired]:
    createMeansAssessmentNotRequiredScenario,
  [MeansAssessmentScenarioName.MissingEligibility]:
    createMissingEligibilityScenario,
  [MeansAssessmentScenarioName.OtherIncomeAndOutgoings]:
    createOtherIncomeAndOutgoingsScenario,
  [MeansAssessmentScenarioName.OutgoingsBreakdownNotCalculated]:
    createUncalculatedOutgoingsScenario,
  [MeansAssessmentScenarioName.OutgoingsBreakdownPartner]:
    createPartnerOutgoingsCalculationScenario,
  [MeansAssessmentScenarioName.OutgoingsBreakdownReady]:
    createOutgoingsCalculationScenario,
  [MeansAssessmentScenarioName.OutgoingsBreakdownUnavailable]:
    createUnavailableOutgoingsCalculationScenario,
  [MeansAssessmentScenarioName.Passporting]: createPassportingScenario,
  [MeansAssessmentScenarioName.PropertiesAndAssets]:
    createPropertiesAndAssetsScenario,
  [MeansAssessmentScenarioName.StaleInactiveAnswers]:
    createStaleInactiveAnswersScenario,
  [MeansAssessmentScenarioName.UnavailableResult]:
    createUnavailableResultScenario,
  [MeansAssessmentScenarioName.Under18ControlledClr]:
    createUnder18ControlledClrScenario,
  [MeansAssessmentScenarioName.Under18NoMeans]: createUnder18NoMeansScenario,
};
