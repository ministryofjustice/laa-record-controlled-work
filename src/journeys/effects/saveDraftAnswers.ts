import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { getJourneyDraftKey } from "#/journeys/journeyDraftKey.js";
import { getSessionData } from "#/journeys/shared.helper.js";

/**
 * Creates the effect that saves the current form context's answers as a draft.
 * @returns The effect function.
 */
export function saveDraftAnswers() {
  /**
   * Persists the current form context's answers into the session as a draft for the journey.
   * @param context The effect function context.
   * @param journeyCode The code of the journey the draft answers belong to.
   */
  return function saveDraftAnswersEffect(
    context: EffectFunctionContext,
    journeyCode: string,
  ): void {
    const session = getSessionData(context);
    const draftKey = getJourneyDraftKey(context, journeyCode);

    session.journeyDrafts ??= {};

    session.journeyDrafts[draftKey] = {
      ...session.journeyDrafts[draftKey],
      ...context.getAllAnswers(),
    };
  };
}
