import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { YourCasesEffectsDeps } from "#/journeys/your-cases/your-cases.types.js";

import { loadYourCaseList } from "#/journeys/your-cases/effects/loadYourCaseList.js";
import { setSelectedOffice } from "#/journeys/your-cases/effects/setSelectedOffice.js";

export const yourCasesEffectsRegistry =
  new EffectRegistry<YourCasesEffectsDeps>();

export const YourCasesEffects = {
  loadYourCaseList: yourCasesEffectsRegistry.register(loadYourCaseList),
  setSelectedOffice: yourCasesEffectsRegistry.register(setSelectedOffice),
};
