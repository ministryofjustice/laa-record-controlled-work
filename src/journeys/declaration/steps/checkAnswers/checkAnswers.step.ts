import {
  Data,
  Format,
  Params,
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { declarationEffects } from "#/journeys/declaration/declaration.effects.js";
import { summaryList } from "#/journeys/declaration/steps/checkAnswers/checkAnswers.blocks.js";
import {
  CONTEXT_DATA_KEYS,
  PARAMS_KEYS,
} from "#/journeys/journey.constants.js";
import { heading, submitButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const CHECK_ANSWERS = t("journeys.createApplication.checkAnswers.title");

/**
 * Creates the check-answers step for the declaration journey.
 *
 * @param journeyCode The code for the journey being submitted.
 * @returns A Forge step definition for the check-answers page.
 */
export function checkAnswersStep(): StepDefinition {
  return step({
    blocks: [heading(CHECK_ANSWERS), summaryList(), submitButton()],
    code: "declaration-check-answers",
    onSubmission: [SubmitApplicationThenGotoTaskList()],
    path: "/check-answers",
    title: CHECK_ANSWERS,
  });
}

/**
 * Creates the submission hook that saves the application and opens the task list.
 *
 * @param journeyCode The code for the journey being submitted.
 * @returns A Forge submission hook.
 */
function SubmitApplicationThenGotoTaskList(): SubmitHook {
  return submit({
    onAlways: {
      effects: [declarationEffects.submitSignedDeclaration()],
      next: [redirectToTaskList],
    },
    validate: false,
  });
}

const redirectToTaskList = redirect({
  goto: Format("/cases/%1/task-list", Params(PARAMS_KEYS.applicationID)),
});
