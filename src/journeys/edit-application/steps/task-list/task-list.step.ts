import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  access,
  Data,
  Format,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { Status } from "#/journeys/journey.types.js";

import { editApplicationEffects } from "#/journeys/edit-application/editApplication.effects.js";
import {
  caseReferenceNumber,
  heading,
  saveAndReturnButton,
  taskList,
} from "#/journeys/edit-application/steps/task-list/task-list.blocks.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export interface TaskListData {
  caseReferenceNumber: ResolvableString;
  clientDetails: { clientName: string; status: Status };
  declaration: { status: Status };
  evidence: { status: Status };
  meansAssessment: { status: Status };
}
const clientName = Format(
  "%1 %2",
  Data(CONTEXT_DATA_KEYS.application).path("clientDetails.firstName"),
  Data(CONTEXT_DATA_KEYS.application).path("clientDetails.lastName"),
);

// TODO temporarily using id until we have a proper reference number in data model
const referenceNumber = Data(CONTEXT_DATA_KEYS.application).path("id");

export const taskListStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      heading(clientName),
      caseReferenceNumber(referenceNumber),
      ...taskList(),
      saveAndReturnButton,
    ],
    onAccess: [
      access({
        effects: [
          editApplicationEffects.loadApplication(),
          editApplicationEffects.setTaskListStatuses(),
        ],
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
