import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { selectOfficeStep } from "#/journeys/select-office/steps/select-office.step.js";

export const selectOfficeJourney = journey({
  code: "selectOffice",
  path: "/select-office",
  reachability: { disableReachabilityChecks: true },
  steps: [selectOfficeStep],
  title: "Select the office you're recording cases from",
  view: { template: "partials/form-step" },
});
