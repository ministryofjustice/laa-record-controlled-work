import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";

import { clearAllDraftAnswers } from "#/journeys/effects/clearAllDraftAnswers.js";
import { clearFieldAnswers } from "#/journeys/effects/clearFieldAnswers.js";
import { loadDraftAnswers } from "#/journeys/effects/loadDraftAnswers.js";
import { saveDraftAnswers } from "#/journeys/effects/saveDraftAnswers.js";

import type { DeclarationDeps } from "./declaration.types.js";

import { submitSignedDeclaration } from "./effects/submitSignedDeclaration.js";

const registry = new EffectRegistry<DeclarationDeps>();

const effects = {
  clearAllDraftAnswers: registry.register(clearAllDraftAnswers),
  clearFieldAnswers: registry.register(clearFieldAnswers),
  loadDraftAnswers: registry.register(loadDraftAnswers),
  saveDraftAnswers: registry.register(saveDraftAnswers),
  submitSignedDeclaration: registry.register(submitSignedDeclaration),
};

export { registry as declarationEffectRegistry, effects as declarationEffects };
