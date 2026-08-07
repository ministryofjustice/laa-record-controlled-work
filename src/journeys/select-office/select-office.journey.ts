import {
  access,
  Condition,
  createForgePackage,
  Data,
  journey,
  redirect,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { SelectOfficeEffectsDeps } from "#/journeys/select-office/select-office.types.js";

import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  selectOfficeEffects,
  selectOfficeEffectsRegistry,
} from "#/journeys/select-office/select-office.effects.js";
import { selectOfficeStep } from "#/journeys/select-office/steps/select-office.step.js";

const SINGLE_OFFICE = 1;

export const selectOfficeJourney = journey({
  code: "selectOffice",
  onAccess: [
    access({
      effects: [selectOfficeEffects.loadOffices()],
    }),
    access({
      effects: [selectOfficeEffects.autoSelectSingleOffice()],
      next: [
        redirect({
          goto: "/cases",
          when: Data(CONTEXT_DATA_KEYS.availableOffices)
            .pipe(Transformer.Array.Length())
            .match(Condition.Equals(SINGLE_OFFICE)),
        }),
      ],
    }),
  ],
  path: "/select-office",
  reachability: { disableReachabilityChecks: true },
  steps: [selectOfficeStep],
  title: "Select the office you're recording cases from",
  view: { template: "partials/form-step" },
});

export const selectOfficePackage = createForgePackage<SelectOfficeEffectsDeps>({
  functions: [selectOfficeEffectsRegistry],
  journey: selectOfficeJourney,
});
