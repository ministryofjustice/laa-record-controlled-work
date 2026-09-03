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
  closeCaseButton,
  heading,
  saveAndReturnButton,
  taskList,
} from "#/journeys/edit-application/steps/task-list/task-list.blocks.js";
import {
  APPLICATION_DATA_KEYS,
  CLIENT_DETAILS_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";

export interface TaskListData {
  caseReferenceNumber: ResolvableString;
  clientDetails: { clientName: ResolvableString; status: Status };
  declaration: { status: Status };
  evidence: { status: Status };
  meansAssessment: { status: Status };
}

const referenceNumber = Data(CONTEXT_DATA_KEYS.application).path(
  APPLICATION_DATA_KEYS.applicationRefNumber,
);

const clientName = Format(
  "%1 %2",
  Data(CONTEXT_DATA_KEYS.application).path(CLIENT_DETAILS_DATA_KEYS.firstName),
  Data(CONTEXT_DATA_KEYS.application).path(CLIENT_DETAILS_DATA_KEYS.lastName),
);

export const taskListStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      heading(clientName),
      caseReferenceNumber(referenceNumber),
      ...taskList(),
      saveAndReturnButton,
      closeCaseButton,
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
          effects: [editApplicationEffects.closeIneligibleCase()],
          next: [
            redirect({
              goto: "/cases",
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
