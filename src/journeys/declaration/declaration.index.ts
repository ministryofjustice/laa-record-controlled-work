import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { DeclarationJourney } from "#/journeys/declaration/declaration.journey.js";

export default createForgePackage({
  functions: {
    ...JourneyEffectsImplementations,
  },
  journey: DeclarationJourney,
});
