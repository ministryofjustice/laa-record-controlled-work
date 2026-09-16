import {
  Data,
  Format,
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  heading,
  summaryList,
} from "#/journeys/create-application/steps/check-answers.blocks.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { submitButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

export const checkAnswersStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [heading, summaryList, submitButton],
    code: "check-answers",
    onSubmission: [createApplicationThenGotoTaskList(journeyCode)],
    path: "/check-answers",
    title: t("journeys.createApplication.checkAnswers.title"),
  });

const createApplicationThenGotoTaskList = (journeyCode: string): SubmitHook =>
  submit({
    onAlways: {
      effects: [CreateApplicationEffects.createApplication(journeyCode)],
      next: [redirectToTaskList],
    },
    validate: false,
  });

const redirectToTaskList = redirect({
  goto: Format("/cases/%1/task-list", Data(CONTEXT_DATA_KEYS.applicationID)),
});
