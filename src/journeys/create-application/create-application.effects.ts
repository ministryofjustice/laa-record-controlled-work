import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

import { createApplication } from "#/journeys/create-application/effects/createApplication.js";
import { clearAllDraftAnswers } from "#/journeys/effects/clearAllDraftAnswers.js";
import { clearFieldAnswers } from "#/journeys/effects/clearFieldAnswers.js";
import { loadDraftAnswers } from "#/journeys/effects/loadDraftAnswers.js";
import { saveDraftAnswers } from "#/journeys/effects/saveDraftAnswers.js";

export const createApplicationEffectsRegistry =
  new EffectRegistry<CreateApplicationEffectsDeps>();

export const CreateApplicationEffects = {
  clearAllDraftAnswers:
    createApplicationEffectsRegistry.register(clearAllDraftAnswers),
  clearFieldAnswers:
    createApplicationEffectsRegistry.register(clearFieldAnswers),
  createApplication:
    createApplicationEffectsRegistry.register(createApplication),
  loadDraftAnswers: createApplicationEffectsRegistry.register(loadDraftAnswers),
  saveDraftAnswers: createApplicationEffectsRegistry.register(saveDraftAnswers),
};
