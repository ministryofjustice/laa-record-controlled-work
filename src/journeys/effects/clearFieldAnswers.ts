import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { isJourneySession } from "#/journeys/context.type.js";

export const clearFieldAnswers =
  () =>
  (
    context: EffectFunctionContext,
    journeyCode: string,
    fields: readonly string[],
  ): void => {
    const session = context.getSession();

    if (!isJourneySession(session)) {
      return;
    }

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
