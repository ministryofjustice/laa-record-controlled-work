import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { PatternEffectsImplementations } from "#/journeys/effects.js";
import { newCaseJourney } from "#/journeys/record-new-case/journey.js";

export default createForgePackage({
  functions: {
    ...PatternEffectsImplementations,
  },
  journey: newCaseJourney,
});
