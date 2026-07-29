import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { SelectOfficeEffectsDeps } from "#/journeys/select-office/select-office.types.js";

import { loadOffices } from "#/journeys/select-office/effects/loadOffices.js";
import { setSelectedOffice } from "#/journeys/select-office/effects/setSelectedOffice.js";

export const selectOfficeEffectsRegistry =
  new EffectRegistry<SelectOfficeEffectsDeps>();

export const selectOfficeEffects = {
  loadOffices: selectOfficeEffectsRegistry.register(loadOffices),
  setSelectedOffice: selectOfficeEffectsRegistry.register(setSelectedOffice),
};
