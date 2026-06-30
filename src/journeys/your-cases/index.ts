import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { yourCasesJourney } from "#/journeys/your-cases/journey.js";

export default createForgePackage({
  functions: {
    ...JourneyEffectsImplementations,
  },
  journey: yourCasesJourney,
});
