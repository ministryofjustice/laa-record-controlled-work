import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { SelectOfficeEffectsDeps } from "#/journeys/select-office/select-office.types.js";

import { autoSelectSingleOffice } from "#/journeys/select-office/effects/autoSelectSingleOffice.js";
import { loadOffices } from "#/journeys/select-office/effects/loadOffices.js";
import { setSelectedOffice } from "#/journeys/select-office/effects/setSelectedOffice.js";

export const selectOfficeEffectsRegistry =
  new EffectRegistry<SelectOfficeEffectsDeps>();

export const selectOfficeEffects = {
  autoSelectSingleOffice: selectOfficeEffectsRegistry.register(
    autoSelectSingleOffice,
  ),
  loadOffices: selectOfficeEffectsRegistry.register(loadOffices),
  setSelectedOffice: selectOfficeEffectsRegistry.register(setSelectedOffice),
};
