import {
  access,
  createForgePackage,
  journey,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { SelectOfficeEffectsDeps } from "#/journeys/select-office/select-office.types.js";

import {
  selectOfficeEffects,
  selectOfficeEffectsRegistry,
} from "#/journeys/select-office/select-office.effects.js";
import { selectOfficeStep } from "#/journeys/select-office/steps/select-office.step.js";

export const selectOfficeJourney = journey({
  code: "selectOffice",
  onAccess: [
    access({
      effects: [selectOfficeEffects.loadOffices()],
    }),
  ],
  path: "/select-office",
  reachability: { disableReachabilityChecks: true },
  steps: [selectOfficeStep],
  title: "Select the office you're recording cases from",
  view: { template: "partials/form-step" },
});

export const selectOfficePacakge = createForgePackage<SelectOfficeEffectsDeps>({
  functions: [selectOfficeEffectsRegistry],
  journey: selectOfficeJourney,
});
