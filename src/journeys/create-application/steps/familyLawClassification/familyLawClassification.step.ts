import {
  Answer,
  Condition,
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { t } from "i18next";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { familyLawQuestion } from "#/journeys/create-application/steps/familyLawClassification/familyLawClassification.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";

const TITLE = t("journeys.createApplication.familyLawClassification.title");

/**
 * Renders the Family Law Classification question step.
 * @param journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} The step definition for the Family Law Classification question step.
 */
export function familyLawClassificationStep(
  journeyCode: string,
): StepDefinition {
  return step({
    blocks: [clientDetailsCaption(), familyLawQuestion(), continueButton()],
    code: StepCode.FAMILY_TYPE_OF_CASE,
    onSubmission: [saveFamilyLawClassification(journeyCode)],
    path: StepCode.FAMILY_TYPE_OF_CASE,
    title: TITLE,
  });
}

/**
 * Handles form submission for the Family Law Classification question step.
 * Saves draft answers and routes based on the selected family law type:
 * - If "private": redirects to eu or international step
 * - If "public": redirects to care proceedings initiated step
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {SubmitHook} A submit hook with validation and conditional routing logic
 */
function saveFamilyLawClassification(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToCheckAnswers,
        redirectToEUOrInternational,
        redirectToLegalAidBefore,
      ],
    },
    validate: true,
  });
}

const redirectToEUOrInternational = redirect({
  goto: StepCode.FAMILY_PRIVATE_NON_MEANS,
  when: Answer(AnswerKey.familyLawClassification).match(
    Condition.Equals("private"),
  ),
});

// const redirectToCareProceedingsInitiated = redirect({
//   goto: "family-public-written-notice",
//   when: Answer(AnswerKey.familyLawClassification).match(
//     Condition.Equals("public"),
//   ),
// });

const redirectToLegalAidBefore = redirect({
  goto: StepCode.LEGAL_AID_BEFORE,
});
