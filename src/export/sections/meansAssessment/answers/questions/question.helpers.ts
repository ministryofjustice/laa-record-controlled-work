import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { AnswerSelection } from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

import { ClientAgeRange } from "#/api/eligibility/eligibility.types.js";
import {
  client,
  partner,
} from "#/export/sections/meansAssessment/answers/answers.selections.js";
import { STATUTORY_PAY_INCOME_TYPE } from "#/export/sections/meansAssessment/calculations/calculations.constants.js";

/**
 * Determines whether either dependant branch is active.
 * @param answers Trusted saved CCQ answers.
 * @returns Whether the client has child or adult dependants.
 */
export function hasDependants(answers: EligibilityData): boolean {
  return answers.child_dependants === true || answers.adult_dependants === true;
}

/**
 * Matches CCQ's childcare eligibility for the client and every active adult.
 * @param answers Trusted saved CCQ answers.
 * @returns Whether childcare costs are relevant to the assessment.
 */
export function isChildcareAvailable(answers: EligibilityData): boolean {
  // Match ChildcareEligibilityService#call and #in_work? in
  // laa-check-client-qualifies/app/services/childcare_eligibility_service.rb.
  return (
    answers.child_dependants === true &&
    qualifiesForChildcare(answers, client) &&
    (!partner.isPresent(answers) || qualifiesForChildcare(answers, partner))
  );
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
    /* eslint-disable @typescript-eslint/naming-convention -- API field names */
    aggregated_means,
    asylum_support,
    client_age,
    controlled_legal_representation,
    immigration_or_asylum,
    level_of_help,
    regular_income,
    under_eighteen_assets,
  } = answers;
  /* eslint-enable @typescript-eslint/naming-convention */

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

/**
 * Checks whether an adult has active childcare-qualifying income.
 * @param answers Trusted saved CCQ answers.
 * @param answer Client or partner answer selectors.
 * @returns Whether student finance or active employment qualifies.
 */
function qualifiesForChildcare(
  answers: EligibilityData,
  answer: AnswerSelection,
): boolean {
  return (
    answer.otherIncome.studentFinance.relevant(answers) === true ||
    // CCQ app/models/check.rb#method_missing exposes active-step incomes only.
    (answer.employmentStatus(answers) === "in_work" &&
      answer
        .employmentIncomes(answers)
        ?.some((income) => income.income_type !== STATUTORY_PAY_INCOME_TYPE) ===
        true)
  );
}
