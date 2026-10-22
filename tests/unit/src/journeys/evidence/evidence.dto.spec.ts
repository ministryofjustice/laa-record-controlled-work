import { EvidenceDto } from "#/api/dto/evidence/evidence.dto.js";
import { EvidenceAnswers } from "#/journeys/evidence/evidence.types.js";
import { expect } from "chai";

const evidenceAnswers: EvidenceAnswers = {
  asylumSupportEvidence: ["some-evidence"],
  benefitsInKindEvidence: ["some-evidence"],
  capitalEvidence: ["some-evidence"],
  childCareEvidence: ["some-evidence"],
  doYouHaveEvidence: "yes",
  employedEvidence: ["some-evidence"],
  housingCostsEvidence: ["some-evidence"],
  incomeEvidence: ["some-evidence"],
  maintenanceEvidence: ["some-evidence"],
  moreDetailsForNoEvidence: "some-details",
  otherEvidence: ["some-evidence"],
  selfEmployedEvidence: ["some-evidence"],
  stateBenefitsEvidence: ["some-evidence"],
  taxCreditsEvidence: ["some-evidence"],
  haveEvidenceOfCapital: "yes",
  haveEvidenceOfExpenditure: "yes",
};

describe("EvidenceAnswers DTO", () => {
  it("should map answers to API request format", () => {
    const expected = {
      expenditureCapitalEvidenceChecklist: {
        capitalEvidence: ["some-evidence"],
        childCareEvidence: ["some-evidence"],
        housingCostsEvidence: ["some-evidence"],
        incomeEvidence: ["some-evidence"],
        maintenanceEvidence: ["some-evidence"],
      },
      incomeEvidenceChecklist: {
        asylumSupportEvidence: ["some-evidence"],
        benefitsInKindEvidence: ["some-evidence"],
        employedEvidence: ["some-evidence"],
        otherEvidence: ["some-evidence"],
        selfEmployedEvidence: ["some-evidence"],
        stateBenefitsEvidence: ["some-evidence"],
        taxCreditsEvidence: ["some-evidence"],
      },
    };

    const result = EvidenceDto.fromAnswers(evidenceAnswers).toRcwApi();
    expect(result).to.deep.equal(expected);
  });

  it("should handle no evidence scenario", () => {
    const noEvidenceAnswers: EvidenceAnswers = {
      doYouHaveEvidence: "no",
      reasonForNoEvidence: "adviceOverPhone",
      moreDetailsForNoEvidence: "some-details",
    };

    const expectedNoEvidence = {
      evidenceExemptionCode: "adviceOverPhone",
      evidenceExemptionReason: "some-details",
    };

    const result = EvidenceDto.fromAnswers(noEvidenceAnswers).toRcwApi();
    expect(result).to.deep.equal(expectedNoEvidence);
  });

  it("should handle no capital or expenditure evidence scenario", () => {
    const noCapitalOrExpenditureEvidenceAnswers: EvidenceAnswers = {
      doYouHaveEvidence: "yes",
      asylumSupportEvidence: ["some-evidence"],
      benefitsInKindEvidence: ["some-evidence"],
      haveEvidenceOfCapital: "no",
      haveEvidenceOfExpenditure: "no",
    };

    const expectedNoCapitalOrExpenditureEvidence = {
      capitalEvidence: undefined,
      childCareEvidence: undefined,
      housingCostsEvidence: undefined,
      incomeEvidence: undefined,
      maintenanceEvidence: undefined,
    };

    const result = EvidenceDto.fromAnswers(
      noCapitalOrExpenditureEvidenceAnswers,
    ).toRcwApi();
    expect(result.expenditureCapitalEvidenceChecklist).to.deep.equal(
      expectedNoCapitalOrExpenditureEvidence,
    );
  });
});
