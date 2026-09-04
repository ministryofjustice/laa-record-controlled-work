import {
  defineEffectFunctions,
  type EffectFunctionContext,
  type EffectFunctionExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { JourneySession } from "./context.type.ts";

export const isJourneySession = (value: unknown): value is JourneySession =>
  typeof value === "object" && value !== null;

export interface JourneyEffectShape {
  /** Clears draft answers for this journey (used after committing drafts to the store). */
  ClearAllDraftAnswers: (journeyCode: string) => EffectFunctionExpr;
  /** Clears the given fields from the session draft and the form context. */
  ClearFieldAnswers: (
    journeyCode: string,
    fields: readonly string[],
  ) => EffectFunctionExpr;
  /** Copies previously stored draft answers for this journey into the form context on access. */
  LoadDraftAnswers: (journeyCode: string) => EffectFunctionExpr;
  /** Persists the current answers into the session as a draft, kept separately from committed answers. */
  SaveDraftAnswers: (journeyCode: string) => EffectFunctionExpr;
}

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

    console.log("answers saved in context during create:", session.journeyDrafts[journeyCode]);
  };

export const {
  effects: JourneyEffects,
  implementations: JourneyEffectsImplementations,
} = defineEffectFunctions<JourneyEffectShape>({
  ClearAllDraftAnswers: clearAllDraftAnswers,
  ClearFieldAnswers: clearFieldAnswers,
  LoadDraftAnswers: loadDraftAnswers,
  SaveDraftAnswers: saveDraftAnswers,
});
