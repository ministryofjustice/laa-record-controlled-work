import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { isJourneySession } from "#/journeys/context.type.js";

export const clearAllDraftAnswers =
  () =>
  (context: EffectFunctionContext, journeyCode: string): void => {
    const session = context.getSession();

    if (!isJourneySession(session)) {
      return;
    }

    if (session.journeyDrafts) {
      const { [journeyCode]: _selectedJourneyDraft, ...otherJourneyDrafts } =
        session.journeyDrafts;

      session.journeyDrafts = otherJourneyDrafts;
    }

    for (const key of Object.keys(context.getAllAnswers())) {
      context.clearAnswer(key);
    }
  };
