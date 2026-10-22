import type { Evidence } from "#/api/clients/rcw/model/evidence.zod.gen.js";
import type { UpdateApplicationEvidenceBody } from "#/api/clients/rcw/model/updateApplicationEvidenceBody.zod.gen.js";
import type {
  EvidenceAnswers,
  EvidenceExemptionReasonCode,
} from "#/journeys/evidence/evidence.types.js";

import { EvidenceAnswers as E } from "#/journeys/evidence/evidence.answers.js";

/**
 *  Data Transfer Object for Evidence answers, mapping between the application's evidence answers and the API request format.
 */
export class EvidenceDto {
  public asylumSupportEvidence?: string[];
  public benefitsInKindEvidence?: string[];
  public capitalEvidence?: string[];
  public childCareEvidence?: string[];
  public doYouHaveEvidence?: string;
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

  /**
   * Constructs an EvidenceDto from the given evidence answers.
   * @param evidence The evidence answers from the application.
   */
  public constructor(evidence: EvidenceAnswers) {
    Object.assign(this, evidence);
  }

  /**
   * Creates an EvidenceDto from the given evidence answers.
   * @param answers The evidence answers from the application.
   * @returns An instance of EvidenceDto containing the mapped evidence answers.
   */
  public static fromAnswers(answers: EvidenceAnswers): EvidenceDto {
    return new EvidenceDto({
      asylumSupportEvidence: answers.asylumSupportEvidence,
      benefitsInKindEvidence: answers.benefitsInKindEvidence,
      capitalEvidence: answers.capitalEvidence,
      childCareEvidence: answers.childCareEvidence,
      doYouHaveEvidence: answers.doYouHaveEvidence,
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

  /**
   * Converts the given API evidence format to the application's evidence answers format.
   * @param evidence The evidence from the API.
   * @returns The application's evidence answers format.
   */
  public static toAnswers(evidence: Evidence): EvidenceAnswers {
    const expenditureEvidence = evidence.expenditureCapitalEvidenceChecklist;
    const hasCapitalEvidence = expenditureEvidence?.capitalEvidence !== undefined;
    const hasExpenditureEvidence = [
      expenditureEvidence?.childCareEvidence,
      expenditureEvidence?.housingCostsEvidence,
      expenditureEvidence?.incomeEvidence,
      expenditureEvidence?.maintenanceEvidence,
    ].every((answer) => answer !== undefined);

    return {
      [E.asylumSupportEvidence]: EvidenceDto.toEvidenceArray(
        evidence.incomeEvidenceChecklist?.asylumSupportEvidence,
      ),
      [E.benefitsInKindEvidence]: EvidenceDto.toEvidenceArray(
        evidence.incomeEvidenceChecklist?.benefitsInKindEvidence,
      ),
      [E.capitalEvidence]: EvidenceDto.toEvidenceArray(
        evidence.expenditureCapitalEvidenceChecklist?.capitalEvidence,
      ),
      [E.childCareEvidence]: EvidenceDto.toEvidenceArray(
        evidence.expenditureCapitalEvidenceChecklist?.childCareEvidence,
      ),
      [E.doYouHaveEvidence]:
        evidence.evidenceExemptionCode === undefined ? "yes" : "no",
      [E.employedEvidence]: EvidenceDto.toEvidenceArray(
        evidence.expenditureCapitalEvidenceChecklist?.employedEvidence,
      ),
      [E.haveEvidenceOfCapital]: hasCapitalEvidence ? "yes" : "no",
      [E.haveEvidenceOfExpenditure]: hasExpenditureEvidence ? "yes" : "no",
      [E.housingCostsEvidence]: EvidenceDto.toEvidenceArray(
        evidence.expenditureCapitalEvidenceChecklist?.housingCostsEvidence,
      ),
      [E.incomeEvidence]: EvidenceDto.toEvidenceArray(
        evidence.expenditureCapitalEvidenceChecklist?.incomeEvidence,
      ),
      [E.maintenanceEvidence]: EvidenceDto.toEvidenceArray(
        evidence.expenditureCapitalEvidenceChecklist?.maintenanceEvidence,
      ),
      [E.moreDetailsForNoEvidence]:
        evidence.evidenceExemptionReason ?? undefined,
      [E.otherEvidence]: EvidenceDto.toEvidenceArray(
        evidence.expenditureCapitalEvidenceChecklist?.otherEvidence,
      ),
      [E.reasonForNoEvidence]: (evidence.evidenceExemptionCode ??
        undefined) as EvidenceExemptionReasonCode | undefined,
      [E.selfEmployedEvidence]: EvidenceDto.toEvidenceArray(
        evidence.expenditureCapitalEvidenceChecklist?.selfEmployedEvidence,
      ),
      [E.stateBenefitsEvidence]: EvidenceDto.toEvidenceArray(
        evidence.incomeEvidenceChecklist?.stateBenefitsEvidence,
      ),
      [E.taxCreditsEvidence]: EvidenceDto.toEvidenceArray(
        evidence.incomeEvidenceChecklist?.taxCreditsEvidence,
      ),
    };
  }

  /**
   * Extracts string answers from an API evidence object.
   * @param evidence The API evidence object to extract strings from.
   * @returns An array of evidence strings or undefined if no valid evidence is found.
   */
  private static toEvidenceArray(evidence: unknown): string[] | undefined {
    if (evidence === null || typeof evidence !== "object") {
      return undefined;
    }

    return Object.values(evidence).filter(
      (value): value is string => typeof value === "string",
    );
  }

  /**
   * Converts the EvidenceDto to the API request format.
   * @returns The API request body for updating application evidence.
   */
  public toRcwApi(): UpdateApplicationEvidenceBody {
    if (this.doYouHaveEvidence === "no") {
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
