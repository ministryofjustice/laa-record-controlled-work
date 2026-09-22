import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { editApplicationEffects } from "#/journeys/edit-application/editApplication.effects.js";
import { confirmationStep } from "#/journeys/edit-application/steps/confirmation/confirmation.step.js";
import { taskListStep } from "#/journeys/edit-application/steps/task-list/task-list.step.js";
import { editClientDetailsJourney } from "#/journeys/edit-client-details/editClientDetails.journey.js";

const loadApiAnswers = access({
  effects: [editApplicationEffects.loadApplication()],
});

export const editApplicationJourney = journey({
  children: [editClientDetailsJourney],
  code: "editApplication",
  onAccess: [loadApiAnswers],
  path: "/cases/:applicationID",
  reachability: { disableReachabilityChecks: true },
  steps: [taskListStep(), confirmationStep()],
  title: "Edit case",
  view: { template: "partials/form-step" },
});
