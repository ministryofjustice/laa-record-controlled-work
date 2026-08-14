import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EvidenceEffectsDeps } from "#/journeys/evidence/evidence.types.js";

import { evidenceEffectsRegistry } from "#/journeys/evidence/evidence.effects.js";
import { evidenceJourney } from "#/journeys/evidence/evidence.journey.js";

export const evidencePackage = createForgePackage<EvidenceEffectsDeps>({
  functions: [evidenceEffectsRegistry],
  journey: evidenceJourney,
});
