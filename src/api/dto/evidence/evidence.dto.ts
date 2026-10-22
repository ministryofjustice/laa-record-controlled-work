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
    return {
      ...EvidenceDto.toIncomeAnswers(evidence),
      ...EvidenceDto.toExpenditureAnswers(evidence),
      [E.doYouHaveEvidence]: EvidenceDto.hasEvidenceExemption(evidence)
        ? "no"
        : "yes",
      [E.haveEvidenceOfCapital]: EvidenceDto.hasCapitalEvidence(evidence)
        ? "yes"
        : "no",
      [E.haveEvidenceOfExpenditure]: EvidenceDto.hasExpenditureEvidence(
        evidence,
      )
        ? "yes"
        : "no",
      [E.moreDetailsForNoEvidence]:
        evidence.evidenceExemptionReason ?? undefined,
      [E.reasonForNoEvidence]: EvidenceDto.toEvidenceExemptionReasonCode(
        evidence.evidenceExemptionCode,
      ),
    };
  }

  /**
   * Checks whether the API includes capital evidence.
   * @param evidence The API evidence object.
   * @returns Whether capital evidence is present.
   */
  private static hasCapitalEvidence(evidence: Evidence): boolean {
    return (
      evidence.expenditureCapitalEvidenceChecklist?.capitalEvidence !==
      undefined
    );
  }

  /**
   * Checks whether the API records a reason for having no evidence.
   * @param evidence The API evidence object.
   * @returns Whether an exemption reason is present.
   */
  private static hasEvidenceExemption(evidence: Evidence): boolean {
    const exemptionCode = evidence.evidenceExemptionCode;

    return exemptionCode !== null && exemptionCode !== "none";
  }

  /**
   * Checks whether all expenditure checklist fields are present.
   * @param evidence The API evidence object.
   * @returns Whether all expenditure fields are present.
   */
  private static hasExpenditureEvidence(evidence: Evidence): boolean {
    const checklist = evidence.expenditureCapitalEvidenceChecklist;

    return [
      checklist?.childCareEvidence,
      checklist?.housingCostsEvidence,
      checklist?.incomeEvidence,
      checklist?.maintenanceEvidence,
    ].every((answer) => answer !== undefined);
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
   * Converts an API exemption code to a supported evidence answer.
   * @param code The API exemption code.
   * @returns The supported reason code, if present.
   */
  private static toEvidenceExemptionReasonCode(
    code: null | string,
  ): EvidenceExemptionReasonCode | undefined {
    switch (code) {
      case "adviceOverPhone":
      case "notPossibleBeforeStart":
      case "personalCircumstances":
        return code;
      default:
        return undefined;
    }
  }

  /**
   * Maps expenditure and capital checklist values to evidence answers.
   * @param evidence The API evidence object.
   * @returns The expenditure and capital answers.
   */
  private static toExpenditureAnswers(
    evidence: Evidence,
  ): Pick<
    EvidenceAnswers,
    | "capitalEvidence"
    | "childCareEvidence"
    | "housingCostsEvidence"
    | "incomeEvidence"
    | "maintenanceEvidence"
  > {
    const checklist = evidence.expenditureCapitalEvidenceChecklist;

    return {
      [E.capitalEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.capitalEvidence,
      ),
      [E.childCareEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.childCareEvidence,
      ),
      [E.housingCostsEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.housingCostsEvidence,
      ),
      [E.incomeEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.incomeEvidence,
      ),
      [E.maintenanceEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.maintenanceEvidence,
      ),
    };
  }

  /**
   * Maps income checklist values to evidence answers.
   * @param evidence The API evidence object.
   * @returns The income answers.
   */
  private static toIncomeAnswers(
    evidence: Evidence,
  ): Pick<
    EvidenceAnswers,
    | "asylumSupportEvidence"
    | "benefitsInKindEvidence"
    | "employedEvidence"
    | "otherEvidence"
    | "selfEmployedEvidence"
    | "stateBenefitsEvidence"
    | "taxCreditsEvidence"
  > {
    const checklist = evidence.incomeEvidenceChecklist;

    return {
      [E.asylumSupportEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.asylumSupportEvidence,
      ),
      [E.benefitsInKindEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.benefitsInKindEvidence,
      ),
      [E.employedEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.employedEvidence,
      ),
      [E.otherEvidence]: EvidenceDto.toEvidenceArray(checklist?.otherEvidence),
      [E.selfEmployedEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.selfEmployedEvidence,
      ),
      [E.stateBenefitsEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.stateBenefitsEvidence,
      ),
      [E.taxCreditsEvidence]: EvidenceDto.toEvidenceArray(
        checklist?.taxCreditsEvidence,
      ),
    };
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
