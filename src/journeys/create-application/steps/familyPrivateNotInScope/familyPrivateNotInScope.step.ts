import {
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  ecfInfo,
  ecfLink,
  ecfTitle,
  guidance,
  heading,
} from "#/journeys/create-application/steps/familyPrivateNotInScope/familyPrivateNotInScope.blocks.js";
import { button } from "#/journeys/shared.blocks.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { t } from "#/lib/i18n.js";

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
      heading(),
      ...guidance(),
      ecfTitle(),
      ecfInfo(),
      ecfLink(),
      button(t("journeys.createApplication.familyPrivateNotInScope.button")),
    ],
    code: StepCode.FAMILY_PRIVATE_NOT_IN_SCOPE,
    onSubmission: [goToCases(journeyCode)],
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
function goToCases(journeyCode: string): SubmitHook {
  return submit({
    onAlways: {
      effects: [CreateApplicationEffects.clearAllDraftAnswers(journeyCode)],
      next: [redirectToCases],
    },
  });
}

const redirectToCases = redirect({ goto: "/cases" });
