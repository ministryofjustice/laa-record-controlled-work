import type {
  ResolvableObject,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

export enum Status {
  CANNOT_START = "CANNOT_START",
  COMPLETED = "COMPLETED",
  INCOMPLETE = "INCOMPLETE",
}

// 25/06/25 forge currently doesnt export type TaskListItem so we have loosely defined it here.
// Once forge exports the type we can remove this and import it from forge instead.
export interface TaskListItem {
  href?: ResolvableString;
  status: TaskListStatus;
  text?: ResolvableString;
  title: {
    classes?: ResolvableString;
    html?: ResolvableString;
    text?: ResolvableString;
  };
}

export interface TaskListStatus {
  classes?: ResolvableString;
  html?: ResolvableString;
  tag?: ResolvableObject<TaskListStatusTag> | TaskListStatusTag;
  text?: ResolvableString;
}

export interface TaskListStatusTag {
  classes?: ResolvableString;
  html?: ResolvableString;
  text?: ResolvableString;
}
