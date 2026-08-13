import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { DeclarationJourney } from "#/journeys/declaration/declaration.journey.js";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";

export default createForgePackage({
  functions: {
    ...JourneyEffectsImplementations,
  },
  journey: DeclarationJourney,
});
