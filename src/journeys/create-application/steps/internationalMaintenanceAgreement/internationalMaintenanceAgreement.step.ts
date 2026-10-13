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
  guidance,
  heading,
  internationalMaintenanceAgreementQuestion,
} from "#/journeys/create-application/steps/internationalMaintenanceAgreement/internationalMaintenanceAgreement.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";

const TITLE = t(
  "journeys.createApplication.internationalMaintenanceAgreement.title",
);

/**
 * Renders the International Maintenance Agreement question step.
 * @param journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} The step definition for the International Maintenance Agreement question step.
 */
export function internationalMaintenanceAgreementStep(
  journeyCode: string,
): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      heading(),
      guidance(),
      internationalMaintenanceAgreementQuestion(),
      continueButton(),
    ],
    code: StepCode.INTERNATIONAL_MAINTENANCE_AGREEMENT,
    onSubmission: [saveInternationalMaintenanceAgreement(journeyCode)],
    path: StepCode.INTERNATIONAL_MAINTENANCE_AGREEMENT,
    title: TITLE,
  });
}

/**
 * Handles form submission for the International Maintenance Agreement question step.
 * Saves draft answers and routes based on the user's response to the International Maintenance Agreement question.
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {SubmitHook} A submit hook with validation and conditional routing logic
 */
function saveInternationalMaintenanceAgreement(
  journeyCode: string,
): SubmitHook {
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
