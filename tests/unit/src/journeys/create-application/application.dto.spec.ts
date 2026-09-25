import { expect } from "chai";
import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";

const answers = {
  ecf: "yes",
  legalAidBefore: "yesSameMatter",
  legalAidLast6Months: "yes",
  reasonForYes: "here is a reason",
  firstName: "Jane",
  lastName: "Bloggs",
  dateOfBirth: "1990-01-01",
  hasNINumber: "yes",
  niNumber: "AB123456C", // gitleaks:allow - fake NI number used to test data mapping
  haveAHomeAddress: "yes",
  ukAddressLine1: "123 Test Street",
  ukAddressLine2: "Test Area",
  ukTownOrCity: "Manchester",
  ukCounty: "Greater Manchester",
  ukPostcode: "A12 3BC",
  ukCountry: "United Kingdom",
};

describe("fromAnswers method", () => {
  it("should map answers to API request format", () => {
    const providerOfficeCode = "22439e72-68d3-4770-b435-c352d883d21e";
    const expected = {
      clientDetails: {
        firstName: "Jane",
        lastName: "Bloggs",
        dateOfBirth: "1990-01-01",
        niNumber: "AB123456C", // gitleaks:allow - fake NI number used to test data mapping
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

  it("omits client address when client has no fixed address", () => {
    const providerOfficeCode = "22439e72-68d3-4770-b435-c352d883d21e";
    const result = ApplicationDto.fromAnswers(
      {
        ...answers,
        haveAHomeAddress: "no",
      },
      providerOfficeCode,
    ).toRcwApi();

    expect(result.clientDetails.hasFixedAddress).to.equal(false);
    expect(result.clientDetails).to.not.have.property("address");
  });

  it("includes client address when client has a fixed address", () => {
    const providerOfficeCode = "22439e72-68d3-4770-b435-c352d883d21e";
    const result = ApplicationDto.fromAnswers(
      {
        ...answers,
        haveAHomeAddress: "yes",
      },
      providerOfficeCode,
    ).toRcwApi();

    expect(result.clientDetails.hasFixedAddress).to.equal(true);
    expect(result.clientDetails.address).to.deep.equal({
      addressLine1: "123 Test Street",
      addressLine2: "Test Area",
      addressLine3: undefined,
      addressLine4: undefined,
      townOrCity: "Manchester",
      county: "Greater Manchester",
      postCode: "A12 3BC",
      country: "GB",
    });
  });
});

describe("toAnswers method", () => {
  const application = {
    id: "00000000-0000-0000-0000-000000000001",
    individualLegalAidNumber: "00000000-0000-0000-0000-000000000002",
    providerFirmCode: "provider-firm",
    providerOfficeCode: "22439e72-68d3-4770-b435-c352d883d21e",
    clientDetails: {
      id: null,
      firstName: "Jane",
      lastName: "Bloggs",
      dateOfBirth: "1990-01-01",
      niNumber: null,
      hasFixedAddress: true,
      address: {
        id: null,
        addressLine1: "123 Test Street",
        addressLine2: "Test Area",
        addressLine3: null,
        addressLine4: null,
        townOrCity: "Manchester",
        postCode: "A12 3BC",
        county: "Greater Manchester",
        country: "GB",
        createdAt: null,
        modifiedAt: null,
      },
      createdAt: null,
      modifiedAt: null,
    },
    applicationState: "DRAFT",
    declaration: null,
    evidence: null,
    eligibility: null,
    reasonForReapplication: null,
    meansAssessmentRequired: null,
    typeOfNonMeans: null,
    contribution: null,
    scopingQuestions: { priorLegalAid: "yesSameMatter" },
    applicationType: "new",
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "test-user",
    modifiedAt: "2025-01-01T00:00:00Z",
    modifiedBy: "test-user",
  } satisfies Application;

  it("maps a UK API address to only the UK answer fields", () => {
    const result = ApplicationDto.toAnswers(application);

    expect(result).to.include({
      ukAddressLine1: "123 Test Street",
      ukAddressLine2: "Test Area",
      ukTownOrCity: "Manchester",
      ukCounty: "Greater Manchester",
      ukPostcode: "A12 3BC",
      ukCountry: "United Kingdom",
    });
    expect(result).to.not.have.any.keys(
      "osAddressLine1",
      "osAddressLine2",
      "osAddressLine3",
      "osAddressLine4",
      "osCountry",
    );
  });

  it("maps an overseas API address to only the overseas answer fields", () => {
    const result = ApplicationDto.toAnswers({
      ...application,
      clientDetails: {
        ...application.clientDetails,
        address: {
          ...application.clientDetails.address,
          addressLine1: "10 Rue de Rivoli",
          addressLine2: null,
          addressLine3: "Paris",
          addressLine4: null,
          townOrCity: null,
          postCode: null,
          county: null,
          country: "FR",
        },
      },
    });

    expect(result).to.include({
      osAddressLine1: "10 Rue de Rivoli",
      osAddressLine3: "Paris",
      osCountry: "France",
    });
    expect(result).to.not.have.any.keys(
      "ukAddressLine1",
      "ukAddressLine2",
      "ukTownOrCity",
      "ukCounty",
      "ukPostcode",
      "ukCountry",
    );
  });

  it("does not populate address answers when the client has no fixed address", () => {
    const result = ApplicationDto.toAnswers({
      ...application,
      clientDetails: {
        ...application.clientDetails,
        hasFixedAddress: false,
        address: null,
      },
    });

    expect(result).to.not.have.any.keys(
      "ukAddressLine1",
      "ukAddressLine2",
      "ukTownOrCity",
      "ukCounty",
      "ukPostcode",
      "ukCountry",
      "osAddressLine1",
      "osAddressLine2",
      "osAddressLine3",
      "osAddressLine4",
      "osCountry",
    );
  });

  it("does not populate address answers when a no-fixed-address application omits its address", () => {
    const { address: _address, ...clientDetailsWithoutAddress } =
      application.clientDetails;
    const result = ApplicationDto.toAnswers({
      ...application,
      clientDetails: {
        ...clientDetailsWithoutAddress,
        hasFixedAddress: false,
      },
    });

    expect(result).to.not.have.any.keys(
      "ukAddressLine1",
      "ukAddressLine2",
      "ukTownOrCity",
      "ukCounty",
      "ukPostcode",
      "ukCountry",
      "osAddressLine1",
      "osAddressLine2",
      "osAddressLine3",
      "osAddressLine4",
      "osCountry",
    );
  });
});
