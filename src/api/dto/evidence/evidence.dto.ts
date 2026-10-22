import { Evidence } from "#/api/clients/rcw/model/evidence.zod.gen.js";
import { UpdateApplicationEvidenceBody } from "#/api/clients/rcw/model/updateApplicationEvidenceBody.zod.gen.js";
import { EvidenceAnswers, EvidenceExemptionReasonCode } from "#/journeys/evidence/evidence.types.js";

export class EvidenceDto {
  public asylumSupportEvidence?: string[];
  public benefitsInKindEvidence?: string[];
  public capitalEvidence?: string[];
  public childCareEvidence?: string[];
  public doYouHaveEvidence?: boolean;
  public employedEvidence?: string[];
  public housingCostsEvidence?: string[];
  public incomeEvidence?: string[];
  public maintenanceEvidence?: string[];
  public moreDetailsForNoEvidence?: string;
  public otherEvidence?: string[];
  public reasonForNoEvidence?: EvidenceExemptionReasonCode;
  public selfEmployedEvidence?: string[];
  public stateBenefitsEvidence?: string[];
  public taxCreditsEvidence?: string[];

  public constructor(evidence: EvidenceAnswers) {
    Object.assign(this, evidence);
  }

  public static toAnswers(evidence: Evidence): EvidenceAnswers {
    const hasCapitalEvidence = evidence.expenditureCapitalEvidenceChecklist?.capitalEvidence !== undefined;
    const hasExpenditureEvidence = evidence.expenditureCapitalEvidenceChecklist?.childCareEvidence !== undefined 
    || evidence.expenditureCapitalEvidenceChecklist?.housingCostsEvidence !== undefined 
    || evidence.expenditureCapitalEvidenceChecklist?.incomeEvidence !== undefined 
    || evidence.expenditureCapitalEvidenceChecklist?.maintenanceEvidence !== undefined;

    return {
        doYouHaveEvidence: evidence.evidenceExemptionCode === undefined ? "yes" : "no",
        reasonForNoEvidence: evidence.evidenceExemptionCode as EvidenceExemptionReasonCode | undefined,
        moreDetailsForNoEvidence: evidence.evidenceExemptionReason ?? undefined,
        haveCapitalEvidence: hasCapitalEvidence,
        haveExpenditureEvidence: hasExpenditureEvidence,
        asylumSupportEvidence: (evidence.incomeEvidenceChecklist?.asylumSupportEvidence ?? undefined) as string[] | undefined,
        benefitsInKindEvidence: (evidence.incomeEvidenceChecklist?.benefitsInKindEvidence ?? undefined) as string[] | undefined,
        capitalEvidence: (evidence.expenditureCapitalEvidenceChecklist?.capitalEvidence ?? undefined) as string[] | undefined,
        childCareEvidence: (evidence.expenditureCapitalEvidenceChecklist?.childCareEvidence ?? undefined) as string[] | undefined,
        employedEvidence: (evidence.expenditureCapitalEvidenceChecklist?.employedEvidence ?? undefined) as string[] | undefined,
        housingCostsEvidence: (evidence.expenditureCapitalEvidenceChecklist?.housingCostsEvidence ?? undefined) as string[] | undefined,
        incomeEvidence: (evidence.expenditureCapitalEvidenceChecklist?.incomeEvidence ?? undefined) as string[] | undefined,
        maintenanceEvidence: (evidence.expenditureCapitalEvidenceChecklist?.maintenanceEvidence ?? undefined) as string[] | undefined,
        otherEvidence: (evidence.expenditureCapitalEvidenceChecklist?.otherEvidence ?? undefined) as string[] | undefined,
        selfEmployedEvidence: (evidence.expenditureCapitalEvidenceChecklist?.selfEmployedEvidence ?? undefined) as string[] | undefined,
        stateBenefitsEvidence: (evidence.incomeEvidenceChecklist?.stateBenefitsEvidence ?? undefined) as string[] | undefined,
        taxCreditsEvidence: (evidence.incomeEvidenceChecklist?.taxCreditsEvidence ?? undefined) as string[] | undefined,
    };
  }

  public static fromAnswers(answers: EvidenceAnswers): EvidenceDto {
    return new EvidenceDto({
        asylumSupportEvidence: answers.asylumSupportEvidence,
        benefitsInKindEvidence: answers.benefitsInKindEvidence,
        capitalEvidence: answers.capitalEvidence,
        childCareEvidence: answers.childCareEvidence,
        doYouHaveEvidence: answers.doYouHaveEvidence === "yes" ? true : false,
        employedEvidence: answers.employedEvidence,
        housingCostsEvidence: answers.housingCostsEvidence,
        incomeEvidence: answers.incomeEvidence,
        maintenanceEvidence: answers.maintenanceEvidence,
        moreDetailsForNoEvidence: answers.moreDetailsForNoEvidence,
        otherEvidence: answers.otherEvidence,
        reasonForNoEvidence: answers.reasonForNoEvidence,
        selfEmployedEvidence: answers.selfEmployedEvidence,
        stateBenefitsEvidence: answers.stateBenefitsEvidence,
        taxCreditsEvidence: answers.taxCreditsEvidence,
    });
  }

  public toRcwApi(): UpdateApplicationEvidenceBody {
    if (this.doYouHaveEvidence === false) {
      return {
        evidenceExemptionCode:
          typeof this.reasonForNoEvidence === "string"
            ? this.reasonForNoEvidence
            : undefined,
        evidenceExemptionReason:
          typeof this.moreDetailsForNoEvidence === "string"
            ? this.moreDetailsForNoEvidence
            : undefined,
      };
    }

    return {
      expenditureCapitalEvidenceChecklist: {
        capitalEvidence: this.capitalEvidence,
        childCareEvidence: this.childCareEvidence,
        housingCostsEvidence: this.housingCostsEvidence,
        incomeEvidence: this.incomeEvidence,
        maintenanceEvidence: this.maintenanceEvidence,
      },
      incomeEvidenceChecklist: {
        asylumSupportEvidence: this.asylumSupportEvidence,
        benefitsInKindEvidence: this.benefitsInKindEvidence,
        employedEvidence: this.employedEvidence,
        otherEvidence: this.otherEvidence,
        selfEmployedEvidence: this.selfEmployedEvidence,
        stateBenefitsEvidence: this.stateBenefitsEvidence,
        taxCreditsEvidence: this.taxCreditsEvidence,
      },
    };
  }
}
