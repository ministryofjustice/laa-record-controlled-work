import type { GovUKTaskList } from "@ministryofjustice/hmpps-forge/govuk-components";

export enum Status {
  CannotStart,
  Completed,
  Incomplete,
}

// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- created type to match forge 0 is the index we need
export type TaskListItem = Parameters<typeof GovUKTaskList>[0]["items"][number];
