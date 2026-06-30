import {
  defineEffectFunctions,
  type EffectFunctionExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { JourneySession } from "./context.type.ts";

const isJourneySession = (value: unknown): value is JourneySession =>
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
  /** Loads a list of cases for the user. */
  LoadCaseList: () => EffectFunctionExpr;
}

export const {
  effects: JourneyEffects,
  implementations: JourneyEffectsImplementations,
} = defineEffectFunctions<JourneyEffectShape>({
  ClearAllDraftAnswers: () => {
    return (context, journeyCode: string) => {
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
  },

  ClearFieldAnswers:
    () => (context, journeyCode: string, fields: readonly string[]) => {
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

  LoadCaseList: () => (context) => {

    const session = context.getSession();

    if (!isJourneySession(session)) {
      return;
    }

    context.setData( 'caseList', [
      {
          clientName: "John Doe",
          referenceNumber: "CASE123456",
          lastUpdated: "2024-06-01"
      },
      {
          clientName: "Jane Smith",
          referenceNumber: "CASE654321",
          lastUpdated: "2024-05-15"
      },
      {
          clientName: "Alice Johnson",
          referenceNumber: "CASE987654",
          lastUpdated: "2024-04-20"
      },
      {
          clientName: "Bob Brown",
          referenceNumber: "CASE456789",
          lastUpdated: "2024-03-10"
      },
      {
          clientName: "Charlie Davis",
          referenceNumber: "CASE321654",
          lastUpdated: "2024-02-05"
      },
      {
          clientName: "Diana Evans",
          referenceNumber: "CASE789123",
          lastUpdated: "2024-01-25"
      },
      {
          clientName: "Ethan Foster",
          referenceNumber: "CASE654987",
          lastUpdated: "2023-12-30"
      },
      {
          clientName: "Fiona Green",
          referenceNumber: "CASE321987",
          lastUpdated: "2023-11-15"
      },
      {
          clientName: "George Harris",
          referenceNumber: "CASE987321",
          lastUpdated: "2023-10-05"
      },
      {
          clientName: "Hannah Irving",
          referenceNumber: "CASE456123",
          lastUpdated: "2023-09-20"
      },
      {
          clientName: "Ian Jackson",
          referenceNumber: "CASE123789",
          lastUpdated: "2023-08-10"
      },
      {
          clientName: "Julia King",
          referenceNumber: "CASE789456",
          lastUpdated: "2023-07-25"
      },
      {
          clientName: "Kevin Lee",
          referenceNumber: "CASE654321",
          lastUpdated: "2023-06-15"
      },
      {
          clientName: "Laura Martin",
          referenceNumber: "CASE321654",
          lastUpdated: "2023-05-05"
      },
      {
          clientName: "Michael Nelson",
          referenceNumber: "CASE987654",
          lastUpdated: "2023-04-20"
      }
  ])
  console.log("Case list loaded into context:", context.getData('caseList'));
}
});
