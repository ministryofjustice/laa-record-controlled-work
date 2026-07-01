import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { CaseListEffectsImplementations } from "#/journeys/your-cases/effects.js";
import { yourCasesJourney } from "#/journeys/your-cases/journey.js";

export default createForgePackage({
  functions: {
    ...CaseListEffectsImplementations,
  },
  journey: yourCasesJourney,
});
