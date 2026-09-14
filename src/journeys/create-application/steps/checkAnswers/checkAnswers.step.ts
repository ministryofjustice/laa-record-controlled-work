import {
  Data,
  Format,
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { summaryList } from "#/journeys/create-application/steps/checkAnswers/checkAnswers.blocks.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { heading, submitButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const CHECK_ANSWERS = t("journeys.createApplication.checkAnswers.title");

/**
 * Creates the check-answers step for the create-application journey.
 *
 * @param journeyCode The code for the journey being submitted.
 * @returns A Forge step definition for the check-answers page.
 */
export function checkAnswersStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [heading(CHECK_ANSWERS), summaryList(), submitButton()],
    code: "check-answers",
    onSubmission: [createApplicationThenGotoTaskList(journeyCode)],
    path: "/check-answers",
    title: t("journeys.createApplication.checkAnswers.title"),
  });
}

/**
 * Creates the submission hook that saves the application and opens the task list.
 *
 * @param journeyCode The code for the journey being submitted.
 * @returns A Forge submission hook.
 */
function createApplicationThenGotoTaskList(journeyCode: string): SubmitHook {
  return submit({
    onAlways: {
      effects: [CreateApplicationEffects.createApplication(journeyCode)],
      next: [redirectToTaskList],
    },
    validate: false,
  });
}

const redirectToTaskList = redirect({
  goto: Format("/cases/%1/task-list", Data(CONTEXT_DATA_KEYS.applicationID)),
});
