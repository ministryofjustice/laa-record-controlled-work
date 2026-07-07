import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  caseReferenceNumber,
  heading,
  saveAndReturnButton,
  taskList,
} from "#/journeys/create-application/steps/task-list/task-list.blocks.js";
import { Status } from "#/journeys/journey.types.js";

export interface TaskListData {
  caseReferenceNumber: string;
  clientDetails: { clientName: string; status: Status };
  declaration: { status: Status };
  evidence: { status: Status };
  meansAssessment: { status: Status };
}
// TODO: Hardcoded for now, will be dynamic in future
const TASK_LIST_DATA: TaskListData = {
  caseReferenceNumber: "CW-123456",
  clientDetails: {
    clientName: "Joe Blogs",
    status: Status.Completed,
  },
  declaration: {
    status: Status.CannotStart,
  },
  evidence: {
    status: Status.Incomplete,
  },
  meansAssessment: {
    status: Status.Incomplete,
  },
};

export const taskListStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      heading(TASK_LIST_DATA.clientDetails.clientName),
      caseReferenceNumber(TASK_LIST_DATA.caseReferenceNumber),
      ...taskList(TASK_LIST_DATA),
      saveAndReturnButton,
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
