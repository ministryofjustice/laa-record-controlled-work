import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { yourCasesJourney } from "#/journeys/your-cases/journey.js";
import { CaseListEffectsImplementations } from "#/journeys/your-cases/effects.js";

export default createForgePackage({
  functions: {
    ...CaseListEffectsImplementations,
  },
  journey: yourCasesJourney,
});
