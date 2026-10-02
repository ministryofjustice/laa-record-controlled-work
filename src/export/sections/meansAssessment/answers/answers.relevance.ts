import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

/**
 * Determines whether saved route selectors show means-tested answers.
 * @param answers Trusted saved CCQ answers.
 * @returns Whether applicant answers are relevant for presentation.
 */
export function isMeansTested(answers: EligibilityData): boolean {
  const underEighteen = answers.client_age === "under_18";
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
