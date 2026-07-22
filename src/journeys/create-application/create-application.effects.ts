import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

import { createApplication } from "#/journeys/create-application/effects/createApplication.js";
import { clearAllDraftAnswers } from "#/journeys/effects.js";

export const createApplicationEffectsRegistry =
  new EffectRegistry<CreateApplicationEffectsDeps>();

export const CreateApplicationEffects = {
  clearAllDraftAnswers:
    createApplicationEffectsRegistry.register(clearAllDraftAnswers),
  clearFieldAnswers:
    createApplicationEffectsRegistry.register(clearAllDraftAnswers),
  createApplication:
    createApplicationEffectsRegistry.register(createApplication),
  loadDraftAnswers:
    createApplicationEffectsRegistry.register(clearAllDraftAnswers),
  saveDraftAnswers:
    createApplicationEffectsRegistry.register(clearAllDraftAnswers),
};
