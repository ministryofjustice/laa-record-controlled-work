import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { loadApplication } from "#/journeys/edit-application/effects/loadApplication.js";
import { loadApplicationAsAnswers } from "#/journeys/edit-client-details/effects/loadApplicationAsAnswers.js";
import {
  clearAllDraftAnswers,
  clearFieldAnswers,
  loadDraftAnswers,
  saveDraftAnswers,
} from "#/journeys/effects.js";

export const editClientDetailsEffectsRegistry =
  new EffectRegistry<EditApplicationEffectsDeps>();

export const editClientDetailsEffects = {
  clearFieldAnswers:
    editClientDetailsEffectsRegistry.register(clearFieldAnswers),
  loadApplication: editClientDetailsEffectsRegistry.register(loadApplication),
  loadApplicationAsAnswers: editClientDetailsEffectsRegistry.register(
    loadApplicationAsAnswers,
  ),
  loadDraftAnswers: editClientDetailsEffectsRegistry.register(loadDraftAnswers),
  saveDraftAnswers: editClientDetailsEffectsRegistry.register(saveDraftAnswers),
  clearAllDraftAnswers: editClientDetailsEffectsRegistry.register(clearAllDraftAnswers),
};
