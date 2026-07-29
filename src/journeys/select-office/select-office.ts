import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";

export const selectOfficeJourney = journey({
  code: "selectOffice",
  path: "/select-office",
  reachability: { disableReachabilityChecks: true },
  steps: [],
  title: "Select the office you're recording cases from",
  view: { template: "partials/form-step" },
});
