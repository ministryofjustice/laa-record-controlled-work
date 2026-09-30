import {
  Condition,
  Format,
  Params,
  Post,
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { declarationEffects } from "#/journeys/declaration/declaration.effects.js";
import {
  confirmButtonGroup,
  summaryList,
} from "#/journeys/declaration/steps/checkAnswers/checkAnswers.blocks.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { heading } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const CHECK_ANSWERS = t("journeys.declaration.checkAnswers.title");

/**
 * Creates the check-answers step for the declaration journey.
 *
 * @returns A Forge step definition for the check-answers page.
 */
export function checkAnswersStep(): StepDefinition {
  return step({
    blocks: [heading(CHECK_ANSWERS), summaryList(), confirmButtonGroup()],
    code: "declaration-check-answers",
    onSubmission: [SubmitApplicationThenGotoTaskList(), ReturnToTaskList()],
    path: "/check-answers",
    title: CHECK_ANSWERS,
  });
}

/**
 * Creates the submission hook that returns the user to the task list without submitting the application.
 *
 * @returns A Forge submission hook.
 */
function ReturnToTaskList(): SubmitHook {
  return submit({
    onAlways: {
      next: [redirectToTaskList],
    },
    when: Post("action").match(Condition.Equals("return")),
  });
}

/**
 * Creates the submission hook that saves the application and opens the task list.
 *
 * @returns A Forge submission hook.
 */
function SubmitApplicationThenGotoTaskList(): SubmitHook {
  return submit({
    onAlways: {
      effects: [declarationEffects.submitSignedDeclaration()],
      next: [redirectToTaskList],
    },
    when: Post("action").match(Condition.Equals("continue")),
  });
}

const redirectToTaskList = redirect({
  goto: Format("/cases/%1/task-list", Params(PARAMS_KEYS.applicationID)),
});
