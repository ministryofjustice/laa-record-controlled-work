import {
  defineEffectFunctions,
  EffectFunctionExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import type { PatternEffectContext } from "./context.type.ts";

export interface PatternEffectShape {
  /** Copies previously stored draft answers for this pattern into the form context on access. */
  LoadDraftAnswers: (patternCode: string) => EffectFunctionExpr;
  /** Persists the current answers into the session as a draft, kept separately from committed answers. */
  SaveDraftAnswers: (patternCode: string) => EffectFunctionExpr;
  /** Clears draft answers for this pattern (used after committing drafts to the store). */
  ClearDraftAnswers: (patternCode: string) => EffectFunctionExpr;
}

export const {
  effects: PatternEffects,
  implementations: PatternEffectsImplementations,
} = defineEffectFunctions<PatternEffectShape>({
  LoadDraftAnswers:
    () => (context: PatternEffectContext, patternCode: string) => {
      const stored = context.getSession()?.patternDrafts?.[patternCode];

      if (!stored) {
        console.log("nothing stored");
        return;
      }

      for (const [code, value] of Object.entries(stored)) {
        if (!context.hasAnswer(code)) {
          context.setAnswer(code, value);
        }
      }
    },

  SaveDraftAnswers:
    () => (context: PatternEffectContext, patternCode: string) => {
      const session = context.getSession();

      if (!session) {
        console.log("no session");
        return;
      }

      if (!session.patternDrafts) {
        session.patternDrafts = {};
      }

      session.patternDrafts[patternCode] = {
        ...session.patternDrafts[patternCode],
        ...context.getAllAnswers(),
      };
    },

  ClearDraftAnswers: () => {
    return (context: PatternEffectContext, patternCode: string) => {
      const session = context.getSession();

      if (session?.patternDrafts) {
        delete session.patternDrafts[patternCode];
      }

      for (const key of Object.keys(context.getAllAnswers())) {
        context.clearAnswer(key);
      }
    };
  },
});
