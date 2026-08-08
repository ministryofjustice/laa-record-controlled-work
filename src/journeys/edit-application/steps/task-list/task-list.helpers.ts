import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  type ChainableRef,
  Condition,
  match,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { Status, type TaskListItem } from "#/journeys/journey.types.js";
import { t } from "#/lib/i18n.js";

/**
 * Builds a single task list item with the appropriate status configuration.
 * @param title - Display text for the task.
 * @param urlPath - URL for the task link (not used for CannotStart).
 * @param status - The current status of the task.
 * @returns A task list item block definition.
 */
export function taskItem(
  title: string,
  urlPath: ResolvableString,
  status: ChainableRef,
): TaskListItem {
  const href = match(status)
    .branch(Condition.Equals(Status.CANNOT_START), null)
    .otherwise(urlPath);

  const classes = match(status)
    .branch(
      Condition.Equals(Status.CANNOT_START),
      "govuk-task-list__status--cannot-start-yet",
    )
    .otherwise("");

  const tag = match(status)
    .branch(Condition.Equals(Status.INCOMPLETE), {
      classes: "govuk-tag--blue",
      text: t("journeys.createApplication.taskList.status.incomplete"),
    })
    .otherwise(null);

  const text = match(status)
    .branch(
      Condition.Equals(Status.CANNOT_START),
      t("journeys.createApplication.taskList.status.cannotStart"),
    )
    .branch(
      Condition.Equals(Status.COMPLETED),
      t("journeys.createApplication.taskList.status.completed"),
    )
    .otherwise("");

  return {
    href,
    status: {
      classes,
      tag,
      text,
    },
    title: { text: title },
  };
}
