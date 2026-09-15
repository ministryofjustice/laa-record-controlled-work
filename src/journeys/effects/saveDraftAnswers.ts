import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

import { isJourneySession } from "#/journeys/context.type.js";

export const saveDraftAnswers =
  () =>
  (context: EffectFunctionContext, journeyCode: string): void => {
    const session = context.getSession();

    if (!isJourneySession(session)) {
      return;
    }

    session.journeyDrafts ??= {};

    session.journeyDrafts[journeyCode] = {
      ...session.journeyDrafts[journeyCode],
      ...context.getAllAnswers(),
    };
  };
