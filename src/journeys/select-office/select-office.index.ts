import {
  createForgePackage,
  journey,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { SelectOfficeEffectsDeps } from "#/journeys/select-office/select-office.types.js";

import { selectOfficeEffectsRegistry } from "#/journeys/select-office/select-office.effects.js";
import { selectOfficeStep } from "#/journeys/select-office/steps/select-office.step.js";

export const selectOfficeJourney = journey({
  code: "selectOffice",
  path: "/select-office",
  reachability: { disableReachabilityChecks: true },
  steps: [selectOfficeStep],
  title: "Select the office you're recording cases from",
  view: { template: "partials/form-step" },
});

export default createForgePackage<SelectOfficeEffectsDeps>({
  functions: [selectOfficeEffectsRegistry],
  journey: selectOfficeJourney,
});
