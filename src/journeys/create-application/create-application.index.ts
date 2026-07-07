import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";

export default createForgePackage({
  functions: {
    ...JourneyEffectsImplementations,
  },
  journey: createApplicationJourney,
});
