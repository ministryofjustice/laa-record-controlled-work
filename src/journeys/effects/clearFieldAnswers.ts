import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { getSessionData } from "#/journeys/shared.helper.js";

/**
 * Creates the effect that clears specific field answers for the current journey.
 * @returns The effect function.
 */
export function clearFieldAnswers() {
  /**
   * Clears the given fields from the journey's stored draft answers and the form context.
   * @param context The effect function context.
   * @param journeyCode The code of the journey whose draft answers should be updated.
   * @param fields The field keys to clear.
   */
  return function clearFieldAnswersEffect(
    context: EffectFunctionContext,
    journeyCode: string,
    fields: readonly string[],
  ): void {
    const session = getSessionData(context);

    if (session.journeyDrafts?.[journeyCode]) {
      const { [journeyCode]: selectedJourneyDraft, ...otherJourneyDrafts } =
        session.journeyDrafts;

      const selectedJourneyWithRemovedFields = Object.fromEntries(
        Object.entries(selectedJourneyDraft).filter(
          ([key]) => !fields.includes(key),
        ),
      );

      session.journeyDrafts = {
        ...otherJourneyDrafts,
        [journeyCode]: selectedJourneyWithRemovedFields,
      };
    }

    for (const field of fields) {
      context.clearAnswer(field);
    }
  };
}
