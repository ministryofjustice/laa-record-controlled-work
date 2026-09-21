import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";

import { createApplication } from "#/journeys/create-application/effects/createApplication.js";
import { normaliseNiNumber } from "#/journeys/create-application/effects/normaliseNiNumber.js";
import {
  clearAllDraftAnswers,
  clearFieldAnswers,
  loadDraftAnswers,
  saveDraftAnswers,
} from "#/journeys/effects.js";

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
  normaliseNiNumber:
    createApplicationEffectsRegistry.register(normaliseNiNumber),
  saveDraftAnswers: createApplicationEffectsRegistry.register(saveDraftAnswers),
};
