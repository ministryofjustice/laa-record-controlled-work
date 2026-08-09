import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { loadApplication } from "#/journeys/edit-application/effects/loadApplication.js";
import {
  clearAllDraftAnswers,
  clearFieldAnswers,
  loadDraftAnswers,
  saveDraftAnswers,
} from "#/journeys/effects.js";

export const editApplicationEffectsRegistry =
  new EffectRegistry<EditApplicationEffectsDeps>();

export const editApplicationEffects = {
  clearAllDraftAnswers:
    editApplicationEffectsRegistry.register(clearAllDraftAnswers),
  clearFieldAnswers: editApplicationEffectsRegistry.register(clearFieldAnswers),
  loadApplication: editApplicationEffectsRegistry.register(loadApplication),
  loadDraftAnswers: editApplicationEffectsRegistry.register(loadDraftAnswers),
  saveDraftAnswers: editApplicationEffectsRegistry.register(saveDraftAnswers),
};
