import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

export interface Case extends Record<string, unknown> {
  clientName: string;
  lastUpdated: string;
  referenceNumber: string;
}

export type CaseListContext = EffectFunctionContext<MyData>;

export interface MyData extends Record<string, unknown> {
  caseList: Case[];
}
