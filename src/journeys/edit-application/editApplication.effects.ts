import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";

import { loadApplication } from "#/journeys/edit-application/effects/loadApplication.js";
import { setTaskListStatuses } from "#/journeys/edit-application/effects/setTaskListStatuses.js";
import { submitApplication } from "#/journeys/edit-application/effects/submitApplication.js";
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
  setTaskListStatuses:
    editApplicationEffectsRegistry.register(setTaskListStatuses),
  submitApplication: editApplicationEffectsRegistry.register(submitApplication),
};
