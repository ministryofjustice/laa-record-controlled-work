import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { YourCasesEffectsDeps } from "#/journeys/your-cases/your-cases.types.js";

import { loadYourCaseList } from "#/journeys/your-cases/effects/loadYourCaseList.js";
import { loadSelectedOffice } from "#/journeys/your-cases/effects/loadSelectedOffice.js";

export const yourCasesEffectsRegistry =
  new EffectRegistry<YourCasesEffectsDeps>();

export const YourCasesEffects = {
  loadYourCaseList: yourCasesEffectsRegistry.register(loadYourCaseList),
  loadSelectedOffice: yourCasesEffectsRegistry.register(loadSelectedOffice),
};
