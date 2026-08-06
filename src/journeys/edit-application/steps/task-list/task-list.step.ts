import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  access,
  Params,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { editApplicationEffects } from "#/journeys/edit-application/editApplication.effects.js";
import {
  caseReferenceNumber,
  heading,
  saveAndReturnButton,
  taskList,
} from "#/journeys/edit-application/steps/task-list/task-list.blocks.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { Status } from "#/journeys/journey.types.js";

export interface TaskListData {
  caseReferenceNumber: ResolvableString;
  clientDetails: { clientName: string; status: Status };
  declaration: { status: Status };
  evidence: { status: Status };
  meansAssessment: { status: Status };
}

// TODO: Hardcoded for now, will be dynamic in future
const TASK_LIST_DATA: TaskListData = {
  caseReferenceNumber: Params(PARAMS_KEYS.applicationID),
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
    onAccess: [
      access({
        effects: [editApplicationEffects.loadApplication()],
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
    reachability: {
      entryWhen: true,
    },
    title: "Task List",
  });
