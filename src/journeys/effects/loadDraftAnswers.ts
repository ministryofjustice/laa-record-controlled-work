import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { isJourneySession } from "#/journeys/context.type.js";

export const loadDraftAnswers =
  () =>
  (context: EffectFunctionContext, journeyCode: string): void => {
    const session = context.getSession();

    if (!isJourneySession(session)) {
      return;
    }

    const stored = session.journeyDrafts?.[journeyCode];

    if (!stored) {
      return;
    }

    for (const [code, value] of Object.entries(stored)) {
      if (!context.hasAnswer(code)) {
        context.setAnswer(code, value);
      }
    }
  };
