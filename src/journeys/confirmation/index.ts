import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";
import { confirmationJourney } from "#/journeys/confirmation/journey.js";
import { PatternEffectsImplementations } from "#/journeys/effects.js";

export default createForgePackage({
  journey: confirmationJourney,
  functions: {
    ...PatternEffectsImplementations,
  },
});
