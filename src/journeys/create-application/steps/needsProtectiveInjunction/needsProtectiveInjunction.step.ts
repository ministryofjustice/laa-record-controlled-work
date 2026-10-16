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
import {
  guidance,
  heading,
  needsProtectiveInjunctionQuestion,
} from "#/journeys/create-application/steps/needsProtectiveInjunction/needsProtectiveInjunction.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";

const TITLE = t("journeys.createApplication.protectThemself.title");

/**
 * Renders the Needs Protective Injunction question step.
 * @param journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} The step definition for the Needs Protective Injunction question step.
 */
export function needsProtectiveInjunctionStep(
  journeyCode: string,
): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      heading(),
      guidance(),
      needsProtectiveInjunctionQuestion(),
      continueButton(),
    ],
    code: StepCode.PROTECT_THEMSELF,
    onSubmission: [saveNeedsProtectiveInjunction(journeyCode), submitInvalid],
    path: "protect-themself",
    title: TITLE,
  });
}

/**
 * Handles form submission for the Needs Protective Injunction question step.
 * Saves draft answers and routes based on the user's response to the Needs Protective Injunction question.
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {SubmitHook} A submit hook with validation and conditional routing logic
 */
function saveNeedsProtectiveInjunction(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToCheckAnswers,
        redirectToLegalAidBefore,
        redirectToPrivateFamilyCaseScope,
      ],
    },
    validate: true,
  });
}

const redirectToLegalAidBefore = redirect({
  goto: "legal-aid-before",
  when: Answer(AnswerKey.needsProtectiveInjunction).match(
    Condition.Equals("yes"),
  ),
});

const redirectToPrivateFamilyCaseScope = redirect({
  goto: "prove-in-scope",
  when: Answer(AnswerKey.needsProtectiveInjunction).match(
    Condition.Equals("no"),
  ),
});

const submitInvalid = submit({
  onInvalid: {},
  validate: true,
});
