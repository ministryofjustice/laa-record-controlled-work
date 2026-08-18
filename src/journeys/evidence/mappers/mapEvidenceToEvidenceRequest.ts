import type { UpdateEvidenceRequestBody } from "#/api/clients/rcw/model/updateEvidenceRequestBody.zod.gen.js";
import type { EvidenceAnswers } from "#/journeys/evidence/evidence.types.js";

/**
 * Maps evidence journey answers to the RCW update evidence request body.
 * @param answers Journey answers from session draft data.
 * @returns Request payload for updateApplicationEvidence.
 */
export function mapEvidenceToEvidenceRequest(
  answers: EvidenceAnswers,
): UpdateEvidenceRequestBody {
  if (answers.doYouHaveEvidence === "no") {
    return {
      evidenceExemptionCode:
        typeof answers.reasonForNoEvidence === "string"
          ? answers.reasonForNoEvidence
          : undefined,
      evidenceExemptionReason:
        typeof answers.moreDetailsForNoEvidence === "string"
          ? answers.moreDetailsForNoEvidence
          : undefined,
    };
  }

  return {
    expenditureCapitalEvidenceChecklist: {
      capitalEvidence: answers.capitalEvidence,
      childCareEvidence: answers.childCareEvidence,
      housingCostsEvidence: answers.housingCostsEvidence,
      incomeEvidence: answers.incomeEvidence,
      maintenanceEvidence: answers.maintenanceEvidence,
    },
    incomeEvidenceChecklist: {
      asylumSupportEvidence: answers.asylumSupportEvidence,
      benefitsInKindEvidence: answers.benefitsInKindEvidence,
      employedEvidence: answers.employedEvidence,
      otherEvidence: answers.otherEvidence,
      selfEmployedEvidence: answers.selfEmployedEvidence,
      stateBenefitsEvidence: answers.stateBenefitsEvidence,
      taxCreditsEvidence: answers.taxCreditsEvidence,
    },
  };
}
