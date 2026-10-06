import {
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { t } from "i18next";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  familyPrivateNonMeansQuestion,
  guidance,
  heading,
} from "#/journeys/create-application/steps/familyPrivateNonMeans/familyPrivateNonMeans.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { AnswerKey } from "#/journeys/AnswerKey.enum.js";

const TITLE = t("journeys.createApplication.familyPrivateNonMeans.title");

/**
 * Renders the Family Private Non-Means question step.
 * @param journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} The step definition for the Family Private Non-Means question step.
 */
export function familyPrivateNonMeansStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      heading(),
      guidance(),
      familyPrivateNonMeansQuestion(),
      continueButton(),
    ],
    code: StepCode.FAMILY_PRIVATE_NON_MEANS,
    onSubmission: [saveFamilyPrivateNonMeans(journeyCode)],
    path: StepCode.FAMILY_PRIVATE_NON_MEANS,
    title: TITLE,
  });
}

/**
 * Handles form submission for the Family Private Non-Means question step.
 * Saves draft answers and routes based on the user's response to the Family Private Non-Means question.
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {SubmitHook} A submit hook with validation and conditional routing logic
 */
function saveFamilyPrivateNonMeans(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [redirectToCheckAnswers, redirectToLegalAidBefore],
    },
    validate: true,
  });
}

const redirectToLegalAidBefore = redirect({
  goto: "legal-aid-before",
});
