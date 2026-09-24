import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { getJourneyDraftKey } from "#/journeys/journeyDraftKey.js";
import { getSessionData } from "#/journeys/shared.helper.js";

/**
 * Creates the effect that loads draft answers into the current form context.
 * @returns The effect function.
 */
export function loadDraftAnswers() {
  /**
   * Copies the journey's stored draft answers into the form context, without overwriting existing answers.
   * @param context The effect function context.
   * @param journeyCode The code of the journey whose draft answers should be loaded.
   */
  return function loadDraftAnswersEffect(
    context: EffectFunctionContext,
    journeyCode: string,
  ): void {
    const session = getSessionData(context);

    const draftKey = getJourneyDraftKey(context, journeyCode);
    const stored = session.journeyDrafts?.[draftKey];

    if (!stored) {
      return;
    }

    for (const [code, value] of Object.entries(stored)) {
      if (!context.hasAnswer(code)) {
        context.setAnswer(code, value);
      }
    }
  };
}
