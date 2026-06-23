import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKButton,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { taskList } from "#/journeys/create-application/steps/task-list/task-list.blocks.js";
import { t } from "#/lib/i18n.js";

export const taskListStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKHeading({ text: "Joe Blogs - TODO DYNAMIC" }),
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
