import {
  defineEffectFunctions,
  type EffectFunctionExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { clearAllDraftAnswers } from "#/journeys/effects/clearAllDraftAnswers.js";
import { clearFieldAnswers } from "#/journeys/effects/clearFieldAnswers.js";
import { loadDraftAnswers } from "#/journeys/effects/loadDraftAnswers.js";
import { saveDraftAnswers } from "#/journeys/effects/saveDraftAnswers.js";

export interface JourneyEffectShape {
  /** Clears draft answers for this journey (used after committing drafts to the store). */
  ClearAllDraftAnswers: (journeyCode: string) => EffectFunctionExpr;
  /** Clears the given fields from the session draft and the form context. */
  ClearFieldAnswers: (
    journeyCode: string,
    fields: readonly string[],
  ) => EffectFunctionExpr;
  /** Copies previously stored draft answers for this journey into the form context on access. */
  LoadDraftAnswers: (journeyCode: string) => EffectFunctionExpr;
  /** Persists the current answers into the session as a draft, kept separately from committed answers. */
  SaveDraftAnswers: (journeyCode: string) => EffectFunctionExpr;
}

export const {
  effects: JourneyEffects,
  implementations: JourneyEffectsImplementations,
} = defineEffectFunctions<JourneyEffectShape>({
  ClearAllDraftAnswers: clearAllDraftAnswers,
  ClearFieldAnswers: clearFieldAnswers,
  LoadDraftAnswers: loadDraftAnswers,
  SaveDraftAnswers: saveDraftAnswers,
});
