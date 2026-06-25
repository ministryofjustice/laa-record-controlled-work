export enum Status {
  CannotStart,
  Completed,
  Incomplete,
}

// 25/06/25 forge currently doesnt export type TaskListItem so we have loosely defined it here.
// Once forge exports the type we can remove this and import it from forge instead.
export interface TaskListItem {
  href?: string;
  status: {
    classes?: string;
    tag?: {
      classes: string;
      text: string;
    };
    text?: string;
  };
  title: {
    text: string;
  };
}
