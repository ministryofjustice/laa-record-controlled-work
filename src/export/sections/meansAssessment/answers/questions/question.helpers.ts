import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { ClientAgeRange } from "#/api/eligibility/eligibility.types.js";

/**
 * Determines whether either dependant branch is active.
 * @param answers Trusted saved CCQ answers.
 * @returns Whether the client has child or adult dependants.
 */
export function hasDependants(answers: EligibilityData): boolean {
  return answers.child_dependants === true || answers.adult_dependants === true;
}

/**
 * Determines whether non-passported income answers are relevant to the export.
 * @param answers Trusted saved CCQ answers.
 * @returns Whether means-tested income questions should be shown.
 */
export function isIncomeAssessmentRelevant(answers: EligibilityData): boolean {
  return isMeansTested(answers) && answers.passporting === false;
}

/**
 * Determines whether saved route selectors show means-tested answers.
 * @param answers Trusted saved CCQ answers.
 * @returns Whether means-tested answers are relevant for presentation.
 */
export function isMeansTested(answers: EligibilityData): boolean {
  const {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    aggregated_means,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    asylum_support,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    client_age,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    controlled_legal_representation,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    immigration_or_asylum,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    level_of_help,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    regular_income,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- API field names
    under_eighteen_assets,
  } = answers;

  const underEighteen = client_age === ClientAgeRange.Under18;
  const controlledClr =
    underEighteen &&
    level_of_help === "controlled" &&
    controlled_legal_representation;
  const noIncomeOrAssets =
    underEighteen &&
    !aggregated_means &&
    !regular_income &&
    !under_eighteen_assets;
  const asylumSupported = immigration_or_asylum && asylum_support;

  return !controlledClr && !noIncomeOrAssets && !asylumSupported;
}
