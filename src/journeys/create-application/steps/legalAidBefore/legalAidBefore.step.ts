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
import { legalAidBeforeRadioInput } from "#/journeys/create-application/steps/legalAidBefore/legalAidBefore.blocks.js";
import { JourneyPath } from "#/journeys/JourneyPath.enum.js";
import {
  backLink,
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import {
  hasCheckAnswersInQuery,
  redirectToCheckAnswers,
} from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { t } from "#/lib/i18n.js";

const ECF_PATH = `${JourneyPath.CREATE_APPLICATION}/ecf`;
const TITLE = t("journeys.createApplication.legalAidBefore.title");

/**
 * Defines the legal aid history step for the create application journey.
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} A step definition for the legal aid history question page
 */
export function legalAidBeforeStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [
      backLink(ECF_PATH),
      clientDetailsCaption(),
      legalAidBeforeRadioInput(),
      continueButton(),
    ],
    code: StepCode.LEGAL_AID_BEFORE,
    onSubmission: [onSubmission(journeyCode)],
    path: "/legal-aid-before",
    reachability: {
      entryWhen: hasCheckAnswersInQuery,
    },
    title: TITLE,
  });
}

/**
 * Handles form submission for the legal aid history question step.
 * Saves draft answers and routes based on the answer:
 * - If "same matter": redirects to legal aid last 6 months step
 * - Otherwise: redirects to client details step
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
        redirectWhenSameMatter,
        redirect({ goto: StepCode.CLIENT_DETAILS }),
      ],
    },
    validate: true,
  });
}

const redirectWhenSameMatter = redirect({
  goto: StepCode.LEGAL_AID_LAST_6_MONTHS,
  when: Answer(AnswerKey.legalAidBefore).match(
    Condition.Equals("yesSameMatter"),
  ),
});
