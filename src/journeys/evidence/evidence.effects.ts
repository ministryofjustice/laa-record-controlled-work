import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { editApplicationEffects } from "#/journeys/edit-application/editApplication.effects.js";
import { updateEvidence } from "#/journeys/evidence/effects/updateEvidence.js";

export const evidenceEffectsRegistry =
  new EffectRegistry<EditApplicationEffectsDeps>();
export const evidenceEffects = {
  ...editApplicationEffects,
  updateEvidence: evidenceEffectsRegistry.register(updateEvidence),
};
