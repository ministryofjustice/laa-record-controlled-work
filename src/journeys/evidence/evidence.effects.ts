import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EvidenceEffectsDeps } from "#/journeys/evidence/evidence.types.js";

import {
  clearAllDraftAnswers,
  clearFieldAnswers,
  loadDraftAnswers,
  saveDraftAnswers,
} from "#/journeys/effects.js";
import { updateEvidence } from "#/journeys/evidence/effects/updateEvidence.js";

export const evidenceEffectsRegistry =
  new EffectRegistry<EvidenceEffectsDeps>();

export const EvidenceEffects = {
  clearAllDraftAnswers: evidenceEffectsRegistry.register(clearAllDraftAnswers),
  clearFieldAnswers: evidenceEffectsRegistry.register(clearFieldAnswers),
  loadDraftAnswers: evidenceEffectsRegistry.register(loadDraftAnswers),
  saveDraftAnswers: evidenceEffectsRegistry.register(saveDraftAnswers),
  updateEvidence: evidenceEffectsRegistry.register(updateEvidence),
};
