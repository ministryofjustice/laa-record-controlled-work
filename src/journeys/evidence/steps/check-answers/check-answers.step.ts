import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { submitButton } from "#/journeys/evidence/common.blocks.js";
import {
  heading,
  summaryList,
} from "#/journeys/evidence/steps/check-answers/check-answers.blocks.js";
import { t } from "#/lib/i18n.js";

export const checkAnswersStep = (): ReturnType<typeof step> =>
  step({
    blocks: [heading, summaryList, submitButton],
    code: "check-answers",
    onSubmission: [
      submit({
        onAlways: {
          next: [
            redirect({
              goto: "/task-list", // TODO: Update to go to specific task list for case
            }),
          ],
        },
        validate: false,
      }),
    ],
    path: "check-answers",
    title: t("journeys.createApplication.checkAnswers.title"),
  });
