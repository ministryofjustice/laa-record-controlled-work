import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";

export default createForgePackage<CreateApplicationEffectsDeps>({
  functions: [
    createApplicationEffectsRegistry,
  ],
  journey: createApplicationJourney,
});
