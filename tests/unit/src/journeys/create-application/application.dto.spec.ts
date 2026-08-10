import { expect } from "chai";
import { ApplicationDto } from "#/api/dto/application/application.dto.js";

const answers = {
  ecf: "yes",
  legalAidBefore: "yesSameMatter",
  legalAidLast6Months: "yes",
  reasonForYes: "here is a reason",
  firstName: "Jane",
  lastName: "Bloggs",
  dateOfBirth: "1990-01-01",
  hasNINumber: "yes",
  niNumber: "QQ123456C", // gitleaks:allow - fake NI number used to test data mapping
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
    const providerOfficeCode = "22439e72-68d3-4770-b435-c352d883d21e";
    const expected = {
      ecfFlag: true,
      clientDetails: {
        firstName: "Jane",
        lastName: "Bloggs",
        dateOfBirth: "1990-01-01",
        niNumber: "QQ123456C", // gitleaks:allow - fake NI number used to test data mapping
        hasFixedAddress: true,
        address: {
          addressLine1: "123 Test Street",
          addressLine2: "Test Area",
          addressLine3: undefined,
          addressLine4: undefined,
          townOrCity: "Manchester",
          county: "Greater Manchester",
          postCode: "A12 3BC",
          country: "GB",
        },
      },
      legalAidBefore: "yesSameMatter",
      legalAidLast6Months: true,
      providerOfficeCode,
      reasonForReapplication: "here is a reason",
      scopingQuestions: {
        priorLegalAid: "yesSameMatter",
      },
    };

    const result = ApplicationDto.fromAnswers(
      answers,
      providerOfficeCode,
    ).toRcwApi();
    expect(result).to.deep.equal(expected);
  });
});
