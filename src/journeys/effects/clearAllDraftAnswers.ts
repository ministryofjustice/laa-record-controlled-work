import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { getJourneyDraftKey } from "#/journeys/journeyDraftKey.js";
import { getSessionData } from "#/journeys/shared.helper.js";

/**
 * Creates the effect that clears all draft answers for the current journey.
 * @returns The effect function.
 */
export function clearAllDraftAnswers() {
  /**
   * Clears the journey's stored draft answers and the current form context's answers.
   * @param context The effect function context.
   * @param journeyCode The code of the journey whose draft answers should be cleared.
   */
  return function clearAllDraftAnswersEffect(
    context: EffectFunctionContext,
    journeyCode: string,
  ): void {
    const session = getSessionData(context);
    const draftKey = getJourneyDraftKey(context, journeyCode);

    if (session.journeyDrafts) {
      const { [draftKey]: _selectedJourneyDraft, ...otherJourneyDrafts } =
        session.journeyDrafts;

      session.journeyDrafts = otherJourneyDrafts;
    }

    for (const key of Object.keys(context.getAllAnswers())) {
      context.clearAnswer(key);
    }
  };
}
