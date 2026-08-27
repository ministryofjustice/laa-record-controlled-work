import {
  Answer,
  Condition,
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { ecfQuestion } from "#/journeys/create-application/steps/ecf/ecf.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.ecf.title");

/**
 * Defines the ECF step for the create application journey.
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} A step definition for the ECF eligibility question page
 */
export function ecfStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [clientDetailsCaption(), ecfQuestion(), continueButton()],
    code: StepCode.ECF,
    onSubmission: [onSubmission(journeyCode)],
    path: "/ecf",
    title: TITLE,
  });
}

/**
 * Handles form submission for the ECF question step.
 * Saves draft answers and routes based on whether ECF was selected:
 * - If "yes": redirects to ECF dropout step
 * - If "no": redirects to legal aid before step
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {SubmitHook} A submit hook with validation and conditional routing logic
 */
function onSubmission(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToCheckAnswers,
        redirectToECFDropout,
        redirectToLegalAidBefore,
      ],
    },
    validate: true,
  });
}

const redirectToECFDropout = redirect({
  goto: StepCode.ECF_DROPOUT,
  when: Answer(AnswerKey.ecf).match(Condition.Equals("yes")),
});

const redirectToLegalAidBefore = redirect({ goto: StepCode.LEGAL_AID_BEFORE });
