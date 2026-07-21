import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { editApplicationJourney } from "#/journeys/edit-application/edit-application.journey.js";

export default createForgePackage({
  functions: {
    ...JourneyEffectsImplementations,
  },
  journey: editApplicationJourney,
});
