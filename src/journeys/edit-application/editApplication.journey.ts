import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { taskListStep } from "#/journeys/edit-application/steps/task-list/task-list.step.js";
import { confirmationStep } from "#/journeys/edit-application/steps/confirmation/confirmation.step.js";
import { editApplicationEffects } from "#/journeys/edit-application/editApplication.effects.js";

export const editApplicationJourney = journey({
  code: "editApplication",
  path: "/cases/:applicationID",
      onAccess: [
      access({
        effects: [
          editApplicationEffects.loadApplication(),
        ],
      }),
    ],
  reachability: { disableReachabilityChecks: true },
  steps: [taskListStep(), confirmationStep()],
  title: "Edit case",
  view: { template: "partials/form-step" },
});
