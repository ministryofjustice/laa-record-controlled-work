import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { editApplicationEffects } from "#/journeys/edit-application/editApplication.effects.js";
import { confirmationStep } from "#/journeys/edit-application/steps/confirmation/confirmation.step.js";
import { taskListStep } from "#/journeys/edit-application/steps/task-list/task-list.step.js";
import { editClientDetailsEffects } from "#/journeys/edit-client-details/editClientDetails.effects.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";

const loadApiAnswers = access({
  effects: [
    editApplicationEffects.loadApplication(),
    editClientDetailsEffects.loadApplicationAsAnswers(
      JourneyCode.EDIT_CLIENT_DETAILS,
    ),
  ],
});

export const editApplicationJourney = journey({
  code: "editApplication",
  onAccess: [
    loadApiAnswers,
  ],
  path: "/cases/:applicationID",
  reachability: { disableReachabilityChecks: true },
  steps: [taskListStep(), confirmationStep()],
  title: "Edit case",
  view: { template: "partials/form-step" },
});
