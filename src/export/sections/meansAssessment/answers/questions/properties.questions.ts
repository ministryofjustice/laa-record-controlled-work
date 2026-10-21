import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type { QuestionSection } from "#/export/sections/meansAssessment/answers/answers.types.js";
import type { AnswerSelection } from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

import {
  client,
  partner,
} from "#/export/sections/meansAssessment/answers/answers.selections.js";
import { isMeansTested } from "#/export/sections/meansAssessment/answers/questions/question.helpers.js";
import { propertyOwnershipChoices } from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

const FIRST_PROPERTY_INDEX = 0;

interface AdditionalPropertyLabels {
  entryHeading: string;
  ownership: string;
  percentageOwned: string;
  sectionHeading: string;
}

/**
 * Determines whether an ownership answer enables property entries.
 * @param ownership Saved ownership answer.
 * @returns Whether the answer owns additional property.
 */
function isOwned(ownership: null | string | undefined): boolean {
  return (
    ownership === "outright" ||
    ownership === "shared_ownership" ||
    ownership === "with_mortgage"
  );
}

/**
 * Creates selection and repeated-entry sections for one property owner.
 * @param params Configuration for the property sections.
 * @param params.answer Owner-specific saved-answer selectors.
 * @param params.labels Translated question labels.
 * @returns Ordered ownership and property detail sections.
 */
function toAdditionalPropertySections(params: {
  answer: AnswerSelection;
  labels: AdditionalPropertyLabels;
}): Array<QuestionSection<EligibilityData>> {
  const { answer, labels } = params;
  const ownershipSection: QuestionSection<EligibilityData> = {
    answerContexts: (answers: EligibilityData) => [answers],
    heading: labels.sectionHeading,
    isRelevant: (answers: EligibilityData) =>
      isMeansTested(answers) && answer.isPresent(answers),
    questions: [
      {
        choices: propertyOwnershipChoices,
        kind: "choice",
        label: labels.ownership,
        select: (answers: EligibilityData) =>
          answer.additionalPropertyOwned(answers),
      },
    ],
  };

  const propertyDetailsSection: QuestionSection<EligibilityData> = {
    answerContexts: (answers: EligibilityData) =>
      answer.additionalProperties(answers).map(() => answers),
    heading: labels.entryHeading,
    isRelevant: (answers: EligibilityData) =>
      isMeansTested(answers) &&
      answer.isPresent(answers) &&
      isOwned(answer.additionalPropertyOwned(answers)),
    questions: [
      {
        kind: "gbp",
        label: "housing.additionalProperties.houseValue",
        select: (answers, index) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates saved property values.
          answer.additionalProperties(answers)[index].house_value!,
      },
      {
        isRelevant: (_answers, _context, index) => index > FIRST_PROPERTY_INDEX,
        kind: "boolean",
        label: "housing.additionalProperties.inlineMortgage",
        select: (answers, index) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates inline ownership on later entries.
          answer.additionalProperties(answers)[index]
            .inline_owned_with_mortgage!,
      },
      {
        isRelevant: (answers, _context, index) =>
          index === FIRST_PROPERTY_INDEX
            ? answer.additionalPropertyOwned(answers) === "with_mortgage"
            : answer.additionalProperties(answers)[index]
                .inline_owned_with_mortgage === true,
        kind: "gbp",
        label: "housing.additionalProperties.mortgage",
        select: (answers, index) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates mortgage amounts when applicable.
          answer.additionalProperties(answers)[index].mortgage!,
      },
      {
        kind: "percentage",
        label: labels.percentageOwned,
        select: (answers, index) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates saved ownership shares.
          answer.additionalProperties(answers)[index].percentage_owned!,
      },
      {
        isRelevant: (answers, _context, index) =>
          answer.isDisputeApplicable(answers) &&
          answer.additionalProperties(answers)[index].house_in_dispute === true,
        kind: "boolean",
        label: "housing.additionalProperties.disputedAsset",
        select: (answers, index) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ persists applicable dispute markers.
          answer.additionalProperties(answers)[index].house_in_dispute!,
      },
    ],
  };

  return [ownershipSection, propertyDetailsSection];
}

const clientAdditionalPropertySections = toAdditionalPropertySections({
  answer: client,
  labels: {
    entryHeading: "housing.additionalProperties.client.entryHeading",
    ownership: "housing.additionalProperties.client.ownership",
    percentageOwned: "housing.additionalProperties.client.percentageOwned",
    sectionHeading: "housing.additionalProperties.client.heading",
  },
});

const partnerAdditionalPropertySections = toAdditionalPropertySections({
  answer: partner,
  labels: {
    entryHeading: "housing.additionalProperties.partner.entryHeading",
    ownership: "housing.additionalProperties.partner.ownership",
    percentageOwned: "housing.additionalProperties.partner.percentageOwned",
    sectionHeading: "housing.additionalProperties.partner.heading",
  },
});

export const additionalPropertyQuestionSections: Array<
  QuestionSection<EligibilityData>
> = [...clientAdditionalPropertySections, ...partnerAdditionalPropertySections];
