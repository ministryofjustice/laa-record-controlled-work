import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { EvidenceJourney } from "#/journeys/evidence/journey.js";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";

export default createForgePackage({
  functions: {
    ...JourneyEffectsImplementations,
  },
  journey: EvidenceJourney,
});
