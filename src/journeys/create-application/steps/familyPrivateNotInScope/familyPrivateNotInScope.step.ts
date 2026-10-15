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
  ecfInfo,
  ecfLink,
  ecfTitle,
  guidance,
  heading,
} from "#/journeys/create-application/steps/familyPrivateNotInScope/familyPrivateNotInScope.blocks.js";
import { button, clientDetailsCaption } from "#/journeys/shared.blocks.js";
import { StepCode } from "#/journeys/StepCode.enum.js";

const TITLE = t("journeys.createApplication.familyPrivateNotInScope.title");

/**
 * Renders the not in scope step.
 * @param journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} The step definition for the not in scope step.
 */
export function familyPrivateNotInScopeStep(
  journeyCode: string,
): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      heading(),
      ...guidance(),
      ecfTitle(),
      ecfInfo(),
      ecfLink(),
      button(t("journeys.createApplication.familyPrivateNotInScope.button")),
    ],
    code: StepCode.FAMILY_PRIVATE_NOT_IN_SCOPE,
    onSubmission: [gotoHome(journeyCode)],
    path: "not-in-scope",
    title: TITLE,
  });
}

/**
 * Handles form submission for the not in scope step.
 * Clears all draft answers from the journey and redirects to the home page.
 *
 * @param {string} journeyCode - The journey code for clearing draft answers
 * @returns {SubmitHook} A submit hook that clears answers and redirects home
 */
function gotoHome(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.clearAllDraftAnswers(journeyCode)],
      next: [redirectToHome],
    },
    validate: true,
  });
}

const redirectToHome = redirect({ goto: "/" });
