import { fromAnswers } from "#/journeys/create-application/Application.dto.js";
import { expect } from "chai";

const answers = {
  ecf: "no",
  legalAidBefore: "yesSameMatter",
  legalAidLast6Months: "yes",
  reasonForYes: "here is a reason",
  firstName: "Jane",
  lastName: "Bloggs",
  dateOfBirth: "1990-01-01",
  hasNINumber: "yes",
  niNumber: "ZZ123456C", // gitleaks:allow - fake NI number used to test data mapping
  haveAHomeAddress: "yes",
  addressLine1: "123 Test Street",
  addressLine2: "Test Area",
  townOrCity: "Manchester",
  county: "Greater Manchester",
  postcode: "A12 3BC",
  country: "United Kingdom",
};

describe("fromAnswers method", () => {
  it("should map answers to API request format", () => {
    const expected = {
      ecfFlag: false,
      clientDetails: {
        firstName: "Jane",
        lastName: "Bloggs",
        dateOfBirth: "1990-01-01",
        niNumber: "ZZ123456C",// gitleaks:allow - fake NI number used to test data mapping
        hasFixedAddress: true,
        address: {
          addressLine1: "123 Test Street",
          addressLine2: "Test Area",
          addressLine3: undefined,
          addressLine4: undefined,
          townOrCity: "Manchester",
          county: "Greater Manchester",
          postcode: "A12 3BC",
          country: "United Kingdom",
        },
      },
      legalAidBefore: "yesSameMatter",
      legalAidLast6Months: true,
      reasonForReapplication: "here is a reason",
    };

    const result = fromAnswers(answers);
    expect(result).to.deep.equal(expected);
  });
});
