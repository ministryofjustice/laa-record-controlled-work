import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { editApplicationJourney } from "#/journeys/edit-application/edit-application.journey.js";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";

export default createForgePackage({
  functions: {
    ...JourneyEffectsImplementations,
  },
  journey: editApplicationJourney,
});
