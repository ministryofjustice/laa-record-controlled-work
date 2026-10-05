import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EvidenceEffectsDeps } from "#/journeys/evidence/evidence.types.js";

import { clearAllDraftAnswers } from "#/journeys/effects/clearAllDraftAnswers.js";
import { clearFieldAnswers } from "#/journeys/effects/clearFieldAnswers.js";
import { loadDraftAnswers } from "#/journeys/effects/loadDraftAnswers.js";
import { saveDraftAnswers } from "#/journeys/effects/saveDraftAnswers.js";
import { updateEvidence } from "#/journeys/evidence/effects/updateEvidence.js";

export const evidenceEffectsRegistry =
  new EffectRegistry<EvidenceEffectsDeps>();

export const evidenceEffects = {
  clearAllDraftAnswers: evidenceEffectsRegistry.register(clearAllDraftAnswers),
  clearFieldAnswers: evidenceEffectsRegistry.register(clearFieldAnswers),
  loadDraftAnswers: evidenceEffectsRegistry.register(loadDraftAnswers),
  saveDraftAnswers: evidenceEffectsRegistry.register(saveDraftAnswers),
  updateEvidence: evidenceEffectsRegistry.register(updateEvidence),
};
