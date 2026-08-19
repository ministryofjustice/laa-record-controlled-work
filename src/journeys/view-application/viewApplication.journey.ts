import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { clientDetailsStep } from "#/journeys/view-application/steps/client-details.step.js";

export const viewApplicationJourney = journey({
  code: "viewApplication",
  path: "/recorded-case/:applicationID",
  reachability: { disableReachabilityChecks: true },
  steps: [clientDetailsStep()],
  title: "View case",
  view: { template: "partials/form-step" },
});
