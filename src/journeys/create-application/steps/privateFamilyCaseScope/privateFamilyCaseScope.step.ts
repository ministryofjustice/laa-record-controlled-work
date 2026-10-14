import {
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  guidance,
  heading,
  scopeQuestion,
} from "#/journeys/create-application/steps/privateFamilyCaseScope/privateFamilyCaseScope.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.privateFamilyCaseScope.title");

/**
 * Renders the Private Family Case Scope question step.
 * @param journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} The step definition for the Private Family Case Scope question step.
 */
export function privateFamilyCaseScopeStep(
  journeyCode: string,
): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      heading(),
      guidance(),
      scopeQuestion(),
      continueButton(),
    ],
    code: StepCode.PRIVATE_FAMILY_CASE_SCOPE,
    onSubmission: [savePrivateFamilyCaseScope(journeyCode)],
    path: StepCode.PRIVATE_FAMILY_CASE_SCOPE,
    title: TITLE,
  });
}

/**
 * Handles form submission for the Private Family Case Scope question step.
 * Saves draft answers and routes based on the user's response to the Private Family Case Scope question.
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {SubmitHook} A submit hook with validation and conditional routing logic
 */
function savePrivateFamilyCaseScope(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [redirectToCheckAnswers, redirectToLegalAidBefore],
    },
    validate: true,
  });
}

const redirectToLegalAidBefore = redirect({
  goto: StepCode.LEGAL_AID_BEFORE,
});
