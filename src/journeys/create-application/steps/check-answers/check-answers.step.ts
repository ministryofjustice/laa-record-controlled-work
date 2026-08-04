import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { heading, submitButton } from "#/journeys/common.blocks.js";
import { summaryList } from "#/journeys/create-application/steps/check-answers/check-answers.blocks.js";
import { DEFAULT_CASE_REFERENCE_NUMBER } from "#/journeys/edit-application/steps/task-list/task-list.step.js";
import { t } from "#/lib/i18n.js";

const title = t("journeys.createApplication.checkAnswers.title");

export const checkAnswersStep = (): ReturnType<typeof step> =>
  step({
    blocks: [heading(title), summaryList, submitButton],
    code: "check-answers",
    onSubmission: [
      submit({
        onAlways: {
          next: [
            redirect({
              goto: `/cases/${DEFAULT_CASE_REFERENCE_NUMBER}/task-list`,
            }),
          ],
        },
        validate: false,
      }),
    ],
    path: "/check-answers",
    title: t("journeys.createApplication.checkAnswers.title"),
  });
