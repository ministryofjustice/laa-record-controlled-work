import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  access,
  Data,
  Format,
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
import {
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";
import { Status } from "#/journeys/journey.types.js";

export interface TaskListData {
  caseReferenceNumber: ResolvableString;
  clientDetails: { clientName: ResolvableString; status: Status };
  declaration: { status: Status };
  evidence: { status: Status };
  meansAssessment: { status: Status };
}

// TODO: Hardcoded for now, will be dynamic in future
const TASK_LIST_DATA: TaskListData = {
  caseReferenceNumber: Data(CONTEXT_DATA_KEYS.application).path("id"),
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

const clientName = Format(
  "%1 %2",
  Data(CONTEXT_DATA_KEYS.application).path("clientDetails.firstName"),
  Data(CONTEXT_DATA_KEYS.application).path("clientDetails.lastName"),
);

export const taskListStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      heading(clientName),
      // TODO caseReferenceNumber to use application ID from context data, until case reference number is generated in backend
      caseReferenceNumber(Data(CONTEXT_DATA_KEYS.application).path("id")),
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
