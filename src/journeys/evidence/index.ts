import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { EvidenceJourney } from "#/journeys/evidence/journey.js";

export default createForgePackage({
  functions: {
    ...JourneyEffectsImplementations,
  },
  journey: EvidenceJourney,
});
