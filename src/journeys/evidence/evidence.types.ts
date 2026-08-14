import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { updateApplicationEvidence } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { JourneySession } from "#/journeys/context.type.js";
import type { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export interface EvidenceAnswers extends Record<string, unknown> {
  asylumSupportEvidence?: string[];
  benefitsInKindEvidence?: string[];
  capitalEvidence?: string[];
  childCareEvidence?: string[];
  doYouHaveEvidence: "no" | "yes";
  employedEvidence?: string[];
  housingCostsEvidence?: string[];
  incomeEvidence?: string[];
  maintenanceEvidence?: string[];
  moreDetailsForNoEvidence?: string;
  otherEvidence?: string[];
  reasonForNoEvidence?: EvidenceExemptionReasonCode;
  selfEmployedEvidence?: string[];
  stateBenefitsEvidence?: string[];
  taxCreditsEvidence?: string[];
}

export type EvidenceContext = EffectFunctionContext<
  EvidenceData,
  EvidenceAnswers,
  JourneySession
>;

export interface EvidenceData extends Record<string, unknown> {
  [CONTEXT_DATA_KEYS.applicationID]: string;
}

export interface EvidenceEffectsDeps {
  updateApplicationEvidence: typeof updateApplicationEvidence;
}

type EvidenceExemptionReasonCode =
  "adviceOverPhone" | "notPossibleBeforeStart" | "personalCircumstances";

/**
 * Type guard to ensure journey draft answers include the required evidence selector.
 * @param value Candidate answers object.
 * @returns Whether the value is a valid EvidenceAnswers shape.
 */
export function isEvidenceAnswers(
  value: Record<string, unknown>,
): value is EvidenceAnswers {
  return value.doYouHaveEvidence === "no" || value.doYouHaveEvidence === "yes";
}
