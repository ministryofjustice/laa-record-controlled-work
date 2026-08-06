import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import { Status, type TaskListItem } from "#/journeys/journey.types.js";
import { t } from "#/lib/i18n.js";

/**
 * Builds a single task list item with the appropriate status configuration.
 * @param title - Display text for the task.
 * @param href - URL for the task link (not used for CannotStart).
 * @param status - The current status of the task.
 * @returns A task list item block definition.
 */
export function taskItem(
  title: string,
  href: ResolvableString,
  status: Status,
): TaskListItem {
  switch (status) {
    case Status.CannotStart:
      return {
        status: {
          classes: "govuk-task-list__status--cannot-start-yet",
          text: t("journeys.createApplication.taskList.status.cannotStart"),
        },
        title: { text: title },
      };
    case Status.Completed:
      return {
        href,
        status: {
          text: t("journeys.createApplication.taskList.status.completed"),
        },
        title: { text: title },
      };
    case Status.Incomplete:
      return {
        href,
        status: {
          tag: {
            classes: "govuk-tag--blue",
            text: t("journeys.createApplication.taskList.status.incomplete"),
          },
        },
        title: { text: title },
      };
  }
}
