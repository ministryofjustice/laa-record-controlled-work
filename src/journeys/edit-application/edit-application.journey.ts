import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  DEFAULT_CASE_REFERENCE_NUMBER,
  taskListStep,
} from "#/journeys/edit-application/steps/task-list/task-list.step.js";

// TODO: path will use a dynamic case ID once the backend supports it
export const editApplicationJourney = journey({
  code: "editApplication",
  path: `/cases/${DEFAULT_CASE_REFERENCE_NUMBER}`,
  reachability: { disableReachabilityChecks: true },
  steps: [taskListStep()],
  title: "Edit case",
  view: { template: "partials/form-step" },
});
