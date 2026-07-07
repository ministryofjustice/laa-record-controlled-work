import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { yourCasesJourney } from "#/journeys/your-cases/your-cases.journey.js";
import {
  YourCasesEffectImplementations,
  type YourCasesEffectsDeps,
} from "#/journeys/your-cases/your-cases.effects.js";

export default createForgePackage<YourCasesEffectsDeps>({
  functions: YourCasesEffectImplementations,
  journey: yourCasesJourney,
});
