import {
  defineEffectFunctions,
  EffectFunctionExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import type { PatternSession } from "./context.type.ts";

const isPatternSession = (value: unknown): value is PatternSession =>
  typeof value === "object" && value !== null;

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
    () => (context, patternCode: string) => {
      const session = context.getSession();

      if (!isPatternSession(session)) {
        return;
      }

      const stored = session.patternDrafts?.[patternCode];

      if (!stored) {
        return;
      }

      for (const [code, value] of Object.entries(stored)) {
        if (!context.hasAnswer(code)) {
          context.setAnswer(code, value);
        }
      }
    },

  SaveDraftAnswers:
    () => (context, patternCode: string) => {
      const session = context.getSession();

      if (!isPatternSession(session)) {
        return;
      }

      session.patternDrafts ??= {};

      session.patternDrafts[patternCode] = {
        ...session.patternDrafts[patternCode],
        ...context.getAllAnswers(),
      };
    },

  ClearDraftAnswers: () => {
    return (context, patternCode: string) => {
      const session = context.getSession();

      if (!isPatternSession(session)) {
        return;
      }

      if (session.patternDrafts) {
        const { [patternCode]: _removed, ...remainingDrafts } =
          session.patternDrafts;
        session.patternDrafts = remainingDrafts;
      }

      for (const key of Object.keys(context.getAllAnswers())) {
        context.clearAnswer(key);
      }
    };
  },
});