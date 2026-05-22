import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { createApplicationJourney } from "#/journeys/create-application/journey.js";

export default createForgePackage({
  functions: {
    ...JourneyEffectsImplementations,
  },
  journey: createApplicationJourney,
});
