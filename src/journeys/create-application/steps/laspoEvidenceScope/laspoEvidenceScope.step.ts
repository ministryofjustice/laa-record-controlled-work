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
import {
  guidance,
  heading,
  scopeQuestion,
} from "#/journeys/create-application/steps/laspoEvidenceScope/laspoEvidenceScope.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.laspoEvidenceScope.title");

/**
 * Renders the Private Family Case Scope question step.
 * @param journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} The step definition for the Private Family Case Scope question step.
 */
export function laspoEvidenceScopeStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      heading(),
      guidance(),
      scopeQuestion(),
      continueButton(),
    ],
    code: StepCode.LASPO_EVIDENCE_SCOPE,
    onSubmission: [saveLaspoEvidenceScope(journeyCode)],
    path: "prove-in-scope",
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
function saveLaspoEvidenceScope(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToCheckAnswers,
        redirectToNotInScope,
        redirectToConfirmMerits,
      ],
    },
    validate: true,
  });
}

/**
 * Redirects to the "Not in Scope" page if the private family case scope is "none".
 */
const redirectToNotInScope = redirect({
  goto: "not-in-scope",
  when: Answer(AnswerKey.laspoEvidenceScope).match(Condition.Equals("none")),
});

/**
 * Redirects to the "Confirm Merits" page if the private family case scope is not "none".
 */
const redirectToConfirmMerits = redirect({
  goto: "confirm-merits",
  when: Answer(AnswerKey.laspoEvidenceScope).not.match(
    Condition.Equals("none"),
  ),
});
