import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

export interface Case extends Record<string, unknown> {
  clientName: string;
  lastUpdated: string;
  referenceNumber: string;
}

export type CaseListContext = EffectFunctionContext<
  MyData,
  Record<string, unknown>,
  unknown,
  Record<string, unknown>
>;

export interface MyData extends Record<string, unknown> {
  caseList: Case[];
}