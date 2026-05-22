import {
  defineEffectFunctions,
  type EffectFunctionExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { JourneySession } from "./context.type.ts";

const isJourneySession = (value: unknown): value is JourneySession =>
  typeof value === "object" && value !== null;

export interface JourneyEffectShape {
  /** Clears draft answers for this journey (used after committing drafts to the store). */
  ClearDraftAnswers: (journeyCode: string) => EffectFunctionExpr;
  /** Copies previously stored draft answers for this journey into the form context on access. */
  LoadDraftAnswers: (journeyCode: string) => EffectFunctionExpr;
  /** Persists the current answers into the session as a draft, kept separately from committed answers. */
  SaveDraftAnswers: (journeyCode: string) => EffectFunctionExpr;
}

export const {
  effects: JourneyEffects,
  implementations: JourneyEffectsImplementations,
} = defineEffectFunctions<JourneyEffectShape>({
  ClearDraftAnswers: () => {
    return (context, journeyCode: string) => {
      const session = context.getSession();

      if (!isJourneySession(session)) {
        return;
      }

      if (session.journeyDrafts) {
        const { [journeyCode]: _removed, ...remainingDrafts } =
          session.journeyDrafts;
        session.journeyDrafts = remainingDrafts;
      }

      for (const key of Object.keys(context.getAllAnswers())) {
        context.clearAnswer(key);
      }
    };
  },

  LoadDraftAnswers: () => (context, journeyCode: string) => {
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
  },

  SaveDraftAnswers: () => (context, journeyCode: string) => {
    const session = context.getSession();

    if (!isJourneySession(session)) {
      return;
    }

    session.journeyDrafts ??= {};

    session.journeyDrafts[journeyCode] = {
      ...session.journeyDrafts[journeyCode],
      ...context.getAllAnswers(),
    };
  },
});
