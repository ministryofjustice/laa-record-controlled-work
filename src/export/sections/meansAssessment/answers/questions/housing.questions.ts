import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type {
  Question,
  QuestionSection,
} from "#/export/sections/meansAssessment/answers/answers.types.js";
import type { StandardFrequencyChoices } from "#/export/sections/meansAssessment/answers/questions/frequencies.js";

import { partner } from "#/export/sections/meansAssessment/answers/answers.selections.js";
import {
  paymentFrequencies,
  standardFrequencyChoices,
} from "#/export/sections/meansAssessment/answers/questions/frequencies.js";
import {
  isIncomeAssessmentRelevant,
  isMeansTested,
} from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";

enum PropertyOwnership {
  None = "none",
  Outright = "outright",
  SharedOwnership = "shared_ownership",
  WithMortgage = "with_mortgage",
}

type HousingFrequencySelector = (
  answers: EligibilityData,
) => null | string | undefined;

const propertyOwnershipChoices = {
  none: "housing.property.ownership.none",
  outright: "housing.property.ownership.outright",
  shared_ownership: "housing.property.ownership.sharedOwnership",
  with_mortgage: "housing.property.ownership.withMortgage",
};

/**
 * Declares a saved frequency when CCQ persisted one.
 * @param label Translation key for the row label.
 * @param choices Domain-local frequency translations.
 * @param select Selector for the saved frequency.
 * @returns A translated frequency question.
 */
function frequencyQuestion(
  label: string,
  choices: StandardFrequencyChoices,
  select: HousingFrequencySelector,
): Question<EligibilityData> {
  return {
    choices,
    isRelevant: (answers) =>
      select(answers) !== null && select(answers) !== undefined,
    kind: "frequency",
    label,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ saves a frequency when applicable.
    select: (answers) => select(answers)!,
  };
}

const propertyQuestionSection: QuestionSection<EligibilityData> = {
  answerContexts: (answers) => [answers],
  heading: "housing.property.heading",
  isRelevant: isMeansTested,
  questions: [
    {
      choices: propertyOwnershipChoices,
      isRelevant: (answers) => answers.partner !== true,
      kind: "choice",
      label: "housing.property.clientOwned",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed property answers.
      select: (answers) => answers.property_owned!,
    },
    {
      choices: propertyOwnershipChoices,
      isRelevant: (answers) => partner.isPresent(answers),
      kind: "choice",
      label: "housing.property.partnerOwned",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed property answers.
      select: (answers) => answers.property_owned!,
    },
    {
      isRelevant: (answers) =>
        answers.property_owned === PropertyOwnership.SharedOwnership,
      kind: "boolean",
      label: "housing.property.landlordOnlyOtherOwner",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ asks this only for shared ownership.
      select: (answers) => answers.property_landlord!,
    },
  ],
};

/**
 * Creates a housing-cost group for one ownership branch.
 * @param params Configuration for the housing-cost group.
 * @param params.ownership Saved ownership choice that activates this group.
 * @param params.questions Ordered questions shown for that branch.
 * @returns The branch-specific housing-cost section.
 */
function toHousingCostsSection(params: {
  ownership: PropertyOwnership;
  questions: Array<Question<EligibilityData>>;
}): QuestionSection<EligibilityData> {
  const { ownership, questions } = params;
  return {
    answerContexts: (answers) => [answers],
    heading: "housing.costs.heading",
    isRelevant: (answers) =>
      isIncomeAssessmentRelevant(answers) &&
      answers.property_owned === ownership,
    questions,
  };
}

const housingBenefitQuestions: Array<Question<EligibilityData>> = [
  {
    isRelevant: (answers) => answers.housing_benefit_relevant === false,
    kind: "boolean",
    label: "housing.costs.housingBenefitQuestion",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ saves the Housing Benefit toggle.
    select: (answers) => answers.housing_benefit_relevant!,
  },
  {
    isRelevant: (answers) => answers.housing_benefit_relevant === true,
    kind: "gbp",
    label: "housing.costs.housingBenefit",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates enabled Housing Benefit amounts.
    select: (answers) => answers.housing_benefit_value!,
  },
  {
    choices: standardFrequencyChoices,
    isRelevant: (answers) =>
      answers.housing_benefit_relevant === true &&
      answers.housing_benefit_frequency !== null &&
      answers.housing_benefit_frequency !== undefined,
    kind: "frequency",
    label: "housing.costs.frequency",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates frequency when Housing Benefit applies.
    select: (answers) => answers.housing_benefit_frequency!,
  },
];

const housingCostQuestionSections: Array<QuestionSection<EligibilityData>> = [
  toHousingCostsSection({
    ownership: PropertyOwnership.None,
    questions: [
      {
        kind: "gbp",
        label: "housing.costs.housingPayments",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates no-home housing costs.
        select: (answers) => answers.housing_payments!,
      },
      frequencyQuestion(
        "housing.costs.frequency",
        paymentFrequencies,
        (answers) => answers.housing_payments_frequency,
      ),
      ...housingBenefitQuestions,
    ],
  }),
  toHousingCostsSection({
    ownership: PropertyOwnership.WithMortgage,
    questions: [
      {
        kind: "gbp",
        label: "housing.costs.mortgagePayments",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates mortgage payments.
        select: (answers) => answers.housing_loan_payments!,
      },
      frequencyQuestion(
        "housing.costs.frequency",
        paymentFrequencies,
        (answers) => answers.housing_payments_loan_frequency,
      ),
    ],
  }),
  toHousingCostsSection({
    ownership: PropertyOwnership.SharedOwnership,
    questions: [
      {
        kind: "gbp",
        label: "housing.costs.rent",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates shared-ownership rent.
        select: (answers) => answers.rent!,
      },
      frequencyQuestion(
        "housing.costs.frequency",
        paymentFrequencies,
        (answers) => answers.combined_frequency,
      ),
      {
        kind: "gbp",
        label: "housing.costs.sharedOwnershipMortgage",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates shared-ownership mortgage payments.
        select: (answers) => answers.shared_ownership_mortgage!,
      },
      frequencyQuestion(
        "housing.costs.frequency",
        paymentFrequencies,
        (answers) => answers.combined_frequency,
      ),
      ...housingBenefitQuestions,
    ],
  }),
];

const mainPropertyQuestionSection: QuestionSection<EligibilityData> = {
  answerContexts: (answers) => [answers],
  heading: "housing.propertyEntry.heading",
  isRelevant: (answers) =>
    isMeansTested(answers) &&
    (answers.property_owned === PropertyOwnership.Outright ||
      answers.property_owned === PropertyOwnership.SharedOwnership ||
      answers.property_owned === PropertyOwnership.WithMortgage),
  questions: [
    {
      kind: "gbp",
      label: "housing.propertyEntry.houseValue",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates owned-home value.
      select: (answers) => answers.house_value!,
    },
    {
      isRelevant: (answers) =>
        answers.property_owned === PropertyOwnership.WithMortgage ||
        answers.property_owned === PropertyOwnership.SharedOwnership,
      kind: "gbp",
      label: "housing.propertyEntry.mortgage",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ requires mortgage for applicable ownership.
      select: (answers) => answers.mortgage!,
    },
    {
      kind: "percentage",
      label: "housing.propertyEntry.percentageOwned",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates ownership share.
      select: (answers) => answers.percentage_owned!,
    },
  ],
};

export const housingQuestionSections: Array<QuestionSection<EligibilityData>> =
  [
    propertyQuestionSection,
    ...housingCostQuestionSections,
    mainPropertyQuestionSection,
  ];
