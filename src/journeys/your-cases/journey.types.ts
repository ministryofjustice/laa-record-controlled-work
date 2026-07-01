import { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

export interface Case extends Record<string, unknown> {
  clientName: string;
  lastUpdated: string;
  referenceNumber: string;
}

interface MyData extends Record<string, unknown> {
  caseList: Case[];
}

export type CaseListContext = EffectFunctionContext<MyData, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;
