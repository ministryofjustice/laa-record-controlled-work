import { expect } from "chai";

import { Answers } from "#/journeys/create-application/data/answers.zod.js";

describe("Answers schema", () => {
  const baseAnswers = {
    ecf: "yes",
    familyLawClassification: "public",
    legalAidBefore: "yesSameMatter",
    legalAidLast6Months: "yes",
    reasonForYes: "here is a reason",
    firstName: "Jane",
    lastName: "Bloggs",
    dateOfBirth: "1990-01-01",
    hasNINumber: "yes",
    niNumber: "AB123456C", // gitleaks:allow - fake NI number used to test schema validation
    haveAHomeAddress: "yes",
    addressLine1: "123 Test Street",
    addressLine2: "Test Area",
    townOrCity: "Manchester",
    county: "Greater Manchester",
    postcode: "A12 3BC",
    country: "United Kingdom",
  };

  it("accepts missing address fields when home address is no", () => {
    const result = Answers.safeParse({
      ...baseAnswers,
      addressLine1: undefined,
      country: undefined,
      haveAHomeAddress: "no",
    });

    expect(result.success).to.equal(true);
  });

  it("rejects missing address fields when home address is yes", () => {
    const result = Answers.safeParse({
      ...baseAnswers,
      addressLine1: undefined,
      country: undefined,
      haveAHomeAddress: "yes",
    });

    expect(result.success).to.equal(false);
  });

  it("accepts optional hidden family law answers", () => {
    const result = Answers.safeParse({
      ...baseAnswers,
      haveAHomeAddress: "no",
      careProceedingsStarted: "yes",
      careProceedingsParentalResponsibility: "no",
      privateFamilyCaseScope: "none",
    });

    expect(result.success).to.equal(true);
    if (result.success) {
      expect(result.data).to.include({
        careProceedingsStarted: "yes",
        careProceedingsParentalResponsibility: "no",
        privateFamilyCaseScope: "none",
      });
    }
  });
});
