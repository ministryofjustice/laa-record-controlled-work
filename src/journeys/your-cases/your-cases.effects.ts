import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { YourCasesEffectsDeps } from "#/journeys/your-cases/your-cases.types.js";

import { loadSelectedOffice } from "#/journeys/your-cases/effects/loadSelectedOffice.js";
import { loadYourCaseList } from "#/journeys/your-cases/effects/loadYourCaseList.js";

export const yourCasesEffectsRegistry =
  new EffectRegistry<YourCasesEffectsDeps>();

export const yourCasesEffects = {
  loadSelectedOffice: yourCasesEffectsRegistry.register(loadSelectedOffice),
  loadYourCaseList: yourCasesEffectsRegistry.register(loadYourCaseList),
};
