import {
  Format,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKButton,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { taskList } from "#/journeys/create-application/steps/task-list/task-list.blocks.js";
import { t } from "#/lib/i18n.js";

// TODO: Hardcoded for now, will be dynamic in future
const CLIENT_NAME = "Joe Blogs";
const CASE_REF_NUMBER = "CW-123456";

export const taskListStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKHeading({ text: CLIENT_NAME }),
      GovUKBody({ text: Format("Reference number: %1", CASE_REF_NUMBER) }),

      ...taskList(),
      GovUKButton({
        classes: "govuk-button--secondary",
        text: t("common.saveAndReturn"),
      }),
    ],
    onSubmission: [
      submit({
        onAlways: {
          next: [
            redirect({
              goto: "/case-list",
            }),
          ],
        },
        validate: false,
      }),
    ],
    path: "/task-list",
    title: "Task List",
  });
