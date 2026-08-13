import {
  access,
  Condition,
  Data,
  Format,
  Post,
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { editApplicationEffects } from "#/journeys/edit-application/editApplication.effects.js";
import {
  buttonGroup,
  caseReferenceNumber,
  heading,
  taskList,
} from "#/journeys/edit-application/steps/task-list/task-list.blocks.js";
import {
  APPLICATION_DATA_KEYS,
  CLIENT_DETAILS_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";

// TODO temporarily using id until we have a proper reference number in data model
const referenceNumber = Data(CONTEXT_DATA_KEYS.application).path(
  APPLICATION_DATA_KEYS.id,
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
      buttonGroup(),
    ],
    onAccess: [
      access({
        effects: [
          editApplicationEffects.loadApplication(),
          editApplicationEffects.setTaskListStatuses(),
        ],
      }),
    ],
    onSubmission: [saveAndReturn(), submitApplication()],
    path: "/task-list",
    reachability: {
      entryWhen: true,
    },
    title: "Task List",
  });

const saveAndReturn = (): SubmitHook =>
  submit({
    onAlways: {
      next: [
        redirect({
          goto: "/case-list",
        }),
      ],
    },
    when: Post("action").match(Condition.Equals("return")),
  });

// TODO: no submission page completed yet
const submitApplication = (): SubmitHook =>
  submit({
    onAlways: {
      next: [
        redirect({
          goto: "/submittedPage-TODO",
        }),
      ],
    },
    when: Post("action").match(Condition.Equals("submit")),
  });
