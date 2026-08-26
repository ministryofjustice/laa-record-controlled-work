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
  ecfDroupoutBody,
  submitFormsBody,
} from "#/journeys/create-application/steps/ecfDropout/ecfDropout.blocks.js";
import { JourneyPath } from "#/journeys/JourneyPath.enum.js";
import { backLink, button, heading } from "#/journeys/shared.blocks.js";

const ECF_PATH = `${JourneyPath.CREATE_APPLICATION}/ecf`;
const HEADING = t("journeys.createApplication.ecfDropout.heading");
const TITLE = t("journeys.createApplication.ecfDropout.title");
const RETURN_TO_CASE_LIST = t("journeys.createApplication.ecfDropout.button");

/**
 * Defines the ECF dropout/ineligibility step for the create application journey.
 *
 * @param {string} journeyCode - The journey code for clearing draft answers
 * @returns {StepDefinition} A step definition for the ECF dropout page
 */
export function ineligibleStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [
      backLink(ECF_PATH),
      heading(HEADING),
      ecfDroupoutBody(),
      submitFormsBody(),
      button(RETURN_TO_CASE_LIST),
    ],
    onSubmission: [onSubmission(journeyCode)],
    path: "/ecf-dropout",
    title: TITLE,
  });
}

/**
 * Handles form submission for the ECF dropout step.
 * Clears all draft answers from the journey and redirects to the home page.
 *
 * @param {string} journeyCode - The journey code for clearing draft answers
 * @returns {SubmitHook} A submit hook that clears answers and redirects home
 */
function onSubmission(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.clearAllDraftAnswers(journeyCode)],
      next: [redirect({ goto: "/" })],
    },
    validate: true,
  });
}
