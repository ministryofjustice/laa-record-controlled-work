import {
  defineEffectFunctions,
  type EffectFunctionExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import type { CaseListSession } from "../context.type.js";

const isCaseListSession = (value: unknown): value is CaseListSession =>
  typeof value === "object" && value !== null;

export interface CaseListEffectShape {
  /** Loads a list of cases for the user. */
  LoadCaseList: () => EffectFunctionExpr;
}

export const {
  effects: CaseListEffects,
  implementations: CaseListEffectsImplementations,
} = defineEffectFunctions<CaseListEffectShape>({
  LoadCaseList: () => (context) => {
    const session = context.getSession();

    if (!isCaseListSession(session)) {
      return;
    }

    context.setData("caseList", [
      {
        clientName: "John Doe",
        lastUpdated: "2024-06-01",
        referenceNumber: "CASE123456",
      },
      {
        clientName: "Jane Smith",
        lastUpdated: "2024-05-15",
        referenceNumber: "CASE654321",
      },
      {
        clientName: "Alice Johnson",
        lastUpdated: "2024-04-20",
        referenceNumber: "CASE987654",
      },
      {
        clientName: "Bob Brown",
        lastUpdated: "2024-03-10",
        referenceNumber: "CASE456789",
      },
      {
        clientName: "Charlie Davis",
        lastUpdated: "2024-02-05",
        referenceNumber: "CASE321654",
      },
      {
        clientName: "Diana Evans",
        lastUpdated: "2024-01-25",
        referenceNumber: "CASE789123",
      },
      {
        clientName: "Ethan Foster",
        lastUpdated: "2023-12-30",
        referenceNumber: "CASE654987",
      },
      {
        clientName: "Fiona Green",
        lastUpdated: "2023-11-15",
        referenceNumber: "CASE321987",
      },
      {
        clientName: "George Harris",
        lastUpdated: "2023-10-05",
        referenceNumber: "CASE987321",
      },
      {
        clientName: "Hannah Irving",
        lastUpdated: "2023-09-20",
        referenceNumber: "CASE456123",
      },
      {
        clientName: "Ian Jackson",
        lastUpdated: "2023-08-10",
        referenceNumber: "CASE123789",
      },
      {
        clientName: "Julia King",
        lastUpdated: "2023-07-25",
        referenceNumber: "CASE789456",
      },
      {
        clientName: "Kevin Lee",
        lastUpdated: "2023-06-15",
        referenceNumber: "CASE654321",
      },
      {
        clientName: "Laura Martin",
        lastUpdated: "2023-05-05",
        referenceNumber: "CASE321654",
      },
      {
        clientName: "Michael Nelson",
        lastUpdated: "2023-04-20",
        referenceNumber: "CASE987654",
      },
    ]);
  },
});
