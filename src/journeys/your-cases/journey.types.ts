import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

export interface Case extends Record<string, unknown> {
  clientName: string;
  lastUpdated: string;
  referenceNumber: string;
}

export type CaseListContext = EffectFunctionContext<
  MyData,
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>
>;

interface MyData extends Record<string, unknown> {
  caseList: Case[];
}
