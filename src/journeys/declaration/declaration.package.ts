import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import { declarationEffectRegistry } from "#/journeys/declaration/declaration.effects.js";
import { DeclarationJourney } from "#/journeys/declaration/declaration.journey.js";

export default createForgePackage({
  functions: declarationEffectRegistry,
  journey: DeclarationJourney,
});
