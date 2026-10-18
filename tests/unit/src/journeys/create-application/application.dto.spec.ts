import { expect } from "chai";
import { ApplicationScopingQuestions } from "#/api/clients/rcw/model/applicationScopingQuestions.zod.gen.js";
import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { Answers } from "#/journeys/create-application/data/answers.zod.js";
import { ScopingQuestions } from "#/api/clients/rcw/model/scopingQuestions.zod.gen.js";

const answers: Answers = {
  ecf: "yes",
  familyLawClassification: "public",
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
      legalAidLast6Months: true,
      providerOfficeCode,
      reasonForReapplication: "here is a reason",
      scopingQuestions: {
        priorLegalAid: "yesSameMatter",
        familyLawClassification: "public",
        careProceedingsStarted: false,
        caseMeetsMeritsCriteria: true,
      },
    };

    const result = ApplicationDto.fromAnswers(
      answers,
      providerOfficeCode,
    ).toRcwApi();
    expect(result).to.deep.equal(expected);
    expect(ScopingQuestions.safeParse(result.scopingQuestions).success).to.equal(
      true,
    );
  });

  it("maps no and different-matter legal aid without recent aid details", () => {
    for (const priorLegalAid of ["no", "yesDifferentMatter"] as const) {
      const result = ApplicationDto.fromAnswers(
        {
          ...answers,
          legalAidBefore: priorLegalAid,
          legalAidLast6Months: undefined,
          reasonForYes: undefined,
        },
        "test-office",
      ).toRcwApi();

      expect(result.scopingQuestions.priorLegalAid).to.equal(priorLegalAid);
      expect(result).to.not.have.property("legalAidLast6Months");
      expect(result).to.not.have.property("reasonForReapplication");
    }
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

  it("omits a stale NI number when the client has no NI number", () => {
    const result = ApplicationDto.fromAnswers(
      { ...answers, hasNINumber: "no" },
      "test-office",
    ).toRcwApi();

    expect(result.clientDetails.niNumber).to.be.undefined;
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

  it("correctly maps scoping questions for private family law classification", () => {
    const providerOfficeCode = "22439e72-68d3-4770-b435-c352d883d21e";
    const result = ApplicationDto.fromAnswers(
      {
        ...answers,
        familyLawClassification: "private",
        needsAdviceOnEUOrInternationalMaintenance: "no",
        needsProtectiveInjunction: "no",
        laspoEvidenceScope: "domesticAbuse",
      },
      providerOfficeCode,
    ).toRcwApi();

    expect(result.scopingQuestions).to.deep.equal({
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: false,
      needsProtectiveInjunction: false,
  laspoEvidenceScope: "domesticAbuse",
      caseMeetsMeritsCriteria: true,
    });
    expect(ScopingQuestions.safeParse(result.scopingQuestions).success).to.equal(
      true,
    );
  });

  it("preserves a negative maintenance advice answer for private family law", () => {
    const result = ApplicationDto.fromAnswers(
      {
        ...answers,
        familyLawClassification: "private",
        needsAdviceOnEUOrInternationalMaintenance: "no",
        needsProtectiveInjunction: "yes",
        laspoEvidenceScope: "domesticAbuse",
      },
      "test-office",
    ).toRcwApi();

    expect(result.scopingQuestions).to.deep.equal({
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: false,
      needsProtectiveInjunction: true,
      caseMeetsMeritsCriteria: true,
    });
  });

  it("preserves a reached private case scope", () => {
    const privateAnswers = {
      ...answers,
      familyLawClassification: "private" as const,
      needsAdviceOnEUOrInternationalMaintenance: "no",
      needsProtectiveInjunction: "no",
      laspoEvidenceScope: "domesticAbuse" as const,
    };

    const result = ApplicationDto.fromAnswers(
      privateAnswers,
      "test-office",
    ).toRcwApi();

    expect(result.scopingQuestions).to.deep.equal({
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: false,
      needsProtectiveInjunction: false,
      laspoEvidenceScope: "domesticAbuse",
      caseMeetsMeritsCriteria: true,
    });
  });

  it("omits skipped private answers after the maintenance shortcut", () => {
    const privateAnswers = {
      ...answers,
      familyLawClassification: "private" as const,
      needsAdviceOnEUOrInternationalMaintenance: "yes",
      needsProtectiveInjunction: "no",
      laspoEvidenceScope: "domesticAbuse" as const,
    };

    const result = ApplicationDto.fromAnswers(
      privateAnswers,
      "test-office",
    ).toRcwApi();

    expect(result.scopingQuestions).to.deep.equal({
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: true,
      caseMeetsMeritsCriteria: true,
    });
  });

  it("correctly maps scoping questions for public family law classification", () => {
    const providerOfficeCode = "22439e72-68d3-4770-b435-c352d883d21e";
    const result = ApplicationDto.fromAnswers(
      {
        ...answers,
        familyLawClassification: "public",
      },
      providerOfficeCode,
    ).toRcwApi();

    expect(result.scopingQuestions).to.deep.equal({
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "public",
      careProceedingsStarted: false,
      caseMeetsMeritsCriteria: true,
    });
  });

  it("preserves reached public answers", () => {
    const publicAnswers = {
      ...answers,
      familyLawClassification: "public" as const,
      careProceedingsStarted: "yes",
      careProceedingsParentalResponsibility: "yes",
    };

    const result = ApplicationDto.fromAnswers(
      publicAnswers,
      "test-office",
    ).toRcwApi();

    expect(result.scopingQuestions).to.deep.equal({
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "public",
      careProceedingsStarted: true,
      careProceedingsParentalResponsibility: true,
      caseMeetsMeritsCriteria: true,
    });
  });

  it("defaults reached public responsibility to false", () => {
    const result = ApplicationDto.fromAnswers(
      {
        ...answers,
        familyLawClassification: "public",
        careProceedingsStarted: "yes",
      },
      "test-office",
    ).toRcwApi();

    expect(result.scopingQuestions).to.include({
      careProceedingsStarted: true,
      careProceedingsParentalResponsibility: false,
      caseMeetsMeritsCriteria: true,
    });
  });
});

describe("toDetailsRequest method", () => {
  it("maps a complete snapshot with explicit nullable fields and no create-only data", () => {
    const result = ApplicationDto.fromAnswers(
      answers,
      "test-office",
    ).toDetailsRequest(true);

    expect(result).to.deep.equal({
      clientDetails: {
        firstName: "Jane",
        lastName: "Bloggs",
        dateOfBirth: "1990-01-01",
        niNumber: "AB123456C", // gitleaks:allow - fake NI number used to test data mapping
        hasFixedAddress: true,
        address: {
          addressLine1: "123 Test Street",
          addressLine2: "Test Area",
          addressLine3: null,
          addressLine4: null,
          townOrCity: "Manchester",
          county: "Greater Manchester",
          postCode: "A12 3BC",
          country: "GB",
        },
      },
      legalAidLast6Months: true,
      reasonForReapplication: "here is a reason",
      scopingQuestions: {
        priorLegalAid: "yesSameMatter",
        familyLawClassification: "public",
        careProceedingsStarted: false,
        caseMeetsMeritsCriteria: true,
      },
      ecfFlag: true,
    });
  });

  it("clears inactive NI, address, and recent-aid answers", () => {
    const result = ApplicationDto.fromAnswers(
      {
        ...answers,
        hasNINumber: "no",
        haveAHomeAddress: "no",
        legalAidBefore: "no",
        legalAidLast6Months: "yes",
        reasonForYes: "stale reason",
      },
      "test-office",
    ).toDetailsRequest(false);

    expect(result.clientDetails).to.deep.equal({
      firstName: "Jane",
      lastName: "Bloggs",
      dateOfBirth: "1990-01-01",
      niNumber: null,
      hasFixedAddress: false,
      address: null,
    });
    expect(result.legalAidLast6Months).to.equal(false);
    expect(result.reasonForReapplication).to.equal(null);
    expect(result.ecfFlag).to.equal(false);
  });

  it("clears a retracted reason when same-matter recent aid is no", () => {
    const result = ApplicationDto.fromAnswers(
      {
        ...answers,
        legalAidLast6Months: "no",
        reasonForYes: "retracted reason",
      },
      "test-office",
    ).toDetailsRequest(true);

    expect(result.legalAidLast6Months).to.equal(false);
    expect(result.reasonForReapplication).to.equal(null);
  });

  it("uses only the active country address when switching between UK and overseas", () => {
    const overseas = ApplicationDto.fromAnswers(
      {
        ...answers,
        ukCountry: "France",
        osAddressLine1: "10 Overseas Street",
        osAddressLine3: "Paris",
        osCountry: "France",
      },
      "test-office",
    ).toDetailsRequest(true);
    expect(overseas.clientDetails.address).to.deep.equal({
      addressLine1: "10 Overseas Street",
      addressLine2: null,
      addressLine3: "Paris",
      addressLine4: null,
      townOrCity: null,
      county: null,
      postCode: null,
      country: "FR",
    });

    const uk = ApplicationDto.fromAnswers(
      {
        ...answers,
        osAddressLine1: "Stale overseas address",
        osCountry: "France",
        ukAddressLine1: "22 Current Street",
        ukAddressLine2: undefined,
        ukCountry: "United Kingdom",
        ukCounty: undefined,
      },
      "test-office",
    ).toDetailsRequest(true);
    expect(uk.clientDetails.address).to.deep.equal({
      addressLine1: "22 Current Street",
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      townOrCity: "Manchester",
      county: null,
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
    scopingQuestions: {
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "public",
    },
    applicationType: "new",
    createdAt: "2025-01-01T00:00:00Z",
    createdBy: "test-user",
    modifiedAt: "2025-01-01T00:00:00Z",
    modifiedBy: "test-user",
    ecfFlag: null
  } satisfies Application;

  function applicationWithScopingQuestions(
    scopingQuestions: Record<string, unknown>,
  ): Application {
    return { ...application, scopingQuestions } as Application;
  }

  it("doesn't set default values for answers which don't exist", () => {
    for (const scopingQuestions of [null, {}]) {
      const result = ApplicationDto.toAnswers({ ...application, scopingQuestions });

      for (const key of [
        "legalAidBefore",
        "familyLawClassification",
        "careProceedingsStarted",
        "needsAdviceOnEUOrInternationalMaintenance",
        "needsProtectiveInjunction",
        "ecf",
      ] as const) {
        expect(result[key], key).to.equal(undefined);
      }
    }
  });

  it("maps a true ECF flag to yes", () => {
    const result = ApplicationDto.toAnswers({ ...application, ecfFlag: true });

    expect(result.ecf).to.equal("yes");
  });

  it("maps a false ECF flag to no", () => {
    const result = ApplicationDto.toAnswers({ ...application, ecfFlag: false });

    expect(result.ecf).to.equal("no");
  });

  it("leaves a null ECF flag unanswered", () => {
    const result = ApplicationDto.toAnswers({ ...application, ecfFlag: null });

    expect(result.ecf).to.equal(undefined);
  });

  it("doesn't default required answers for missing address data", () => {
    const result = ApplicationDto.toAnswers({
      ...application,
      clientDetails: { ...application.clientDetails, address: null },
    });

    expect(result.haveAHomeAddress).to.equal("yes");
    expect(result.ukAddressLine1).to.equal(undefined);
    expect(result.osAddressLine1).to.equal(undefined);
  });

  it("doesn't select family law classification when classification is missing", () => {
    const result = ApplicationDto.toAnswers(applicationWithScopingQuestions({
      priorLegalAid: "no",
      careProceedingsStarted: true,
    }));

    expect(result.familyLawClassification).to.equal(undefined);
    expect(result.careProceedingsStarted).to.equal(undefined);
  });

  it("doesn't default scoping question answers if data is missing", () => {
    for (const missing of [undefined, null]) {
      const privateResult = ApplicationDto.toAnswers(applicationWithScopingQuestions({
        priorLegalAid: "no",
        familyLawClassification: "private",
        needsAdviceOnEUOrInternationalMaintenance: false,
        needsProtectiveInjunction: missing,
      }));
      expect(privateResult.needsAdviceOnEUOrInternationalMaintenance).to.equal("no");
      expect(privateResult.needsProtectiveInjunction).to.equal(undefined);

      const publicResult = ApplicationDto.toAnswers(applicationWithScopingQuestions({
        priorLegalAid: "no",
        familyLawClassification: "public",
        careProceedingsStarted: missing,
      }));
      expect(publicResult.careProceedingsStarted).to.equal(undefined);
      expect(publicResult.careProceedingsParentalResponsibility).to.equal(undefined);
    }
  });

  it("doesn't allow public branch parental responsibility to be set if care proceedings started is false", () => {
    const result = ApplicationDto.toAnswers(applicationWithScopingQuestions({
      priorLegalAid: "no",
      familyLawClassification: "public",
      careProceedingsStarted: false,
      careProceedingsParentalResponsibility: true,
    }));
    expect(result.careProceedingsStarted).to.equal("no");
    expect(result.careProceedingsParentalResponsibility).to.equal(undefined);
  });

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

  it("maps scoping questions correctly for private family law classification", () => {
    const result = ApplicationDto.toAnswers(
      applicationWithScopingQuestions({
        priorLegalAid: "yesSameMatter",
        familyLawClassification: "private",
        needsAdviceOnEUOrInternationalMaintenance: false,
        needsProtectiveInjunction: false,
        laspoEvidenceScope: "domesticAbuse",
      }),
    );

    expect(result).to.include({
      legalAidBefore: "yesSameMatter",
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: "no",
      needsProtectiveInjunction: "no",
      laspoEvidenceScope: "domesticAbuse",
    });
  });

  it("maps scoping questions correctly for public family law classification", () => {
    const result = ApplicationDto.toAnswers(
      applicationWithScopingQuestions({
        priorLegalAid: "no",
        familyLawClassification: "public",
      }),
    );

    expect(result).to.include({
      legalAidBefore: "no",
      familyLawClassification: "public",
    });

    expect(result).to.not.have.any.keys(
      "needsAdviceOnEUOrInternationalMaintenance",
      "needsProtectiveInjunction",
      "laspoEvidenceScope",
    );
  });

  it("leaves exposed private answers missing for sparse historical applications", () => {
    const scopingQuestions = {
      priorLegalAid: "no",
      familyLawClassification: "private",
    };
    expect(
      ApplicationScopingQuestions.safeParse(scopingQuestions).success,
    ).to.equal(true);

    const result = ApplicationDto.toAnswers(
      applicationWithScopingQuestions(scopingQuestions),
    );

    expect(result.needsAdviceOnEUOrInternationalMaintenance).to.equal(undefined);
    expect(result.needsProtectiveInjunction).to.equal(undefined);
    expect(result.laspoEvidenceScope).to.equal(undefined);
  });

  it("preserves a saved private scope when the question was reached", () => {
    const result = ApplicationDto.toAnswers(
      applicationWithScopingQuestions({
        priorLegalAid: "no",
        familyLawClassification: "private",
        needsAdviceOnEUOrInternationalMaintenance: false,
        needsProtectiveInjunction: false,
        laspoEvidenceScope: "childAbuse",
      }),
    );

    expect(result).to.include({
      needsAdviceOnEUOrInternationalMaintenance: "no",
      needsProtectiveInjunction: "no",
      laspoEvidenceScope: "childAbuse",
    });
  });

  it("omits a skipped scope answer when a protective injunction applies", () => {
    const result = ApplicationDto.toAnswers(
      applicationWithScopingQuestions({
        priorLegalAid: "no",
        familyLawClassification: "private",
        needsAdviceOnEUOrInternationalMaintenance: false,
        needsProtectiveInjunction: true,
        laspoEvidenceScope: "domesticAbuse",
      }),
    );

    expect(result).to.include({ needsProtectiveInjunction: "yes" });
    expect(result).to.not.have.any.keys("laspoEvidenceScope");
  });

  it("omits skipped answers when hydrating a maintenance shortcut", () => {
    const result = ApplicationDto.toAnswers(
      applicationWithScopingQuestions({
        priorLegalAid: "no",
        familyLawClassification: "private",
        needsAdviceOnEUOrInternationalMaintenance: true,
        needsProtectiveInjunction: false,
        laspoEvidenceScope: "domesticAbuse",
      }),
    );

    expect(result).to.include({
      needsAdviceOnEUOrInternationalMaintenance: "yes",
    });
    expect(result).to.not.have.any.keys(
      "needsProtectiveInjunction",
      "laspoEvidenceScope",
    );
  });

  it("defaults public answers only along the reached path", () => {
    const result = ApplicationDto.toAnswers(
      applicationWithScopingQuestions({
        priorLegalAid: "no",
        familyLawClassification: "public",
        careProceedingsStarted: true,
      }),
    );

    expect(result).to.include({
      careProceedingsStarted: "yes",
      careProceedingsParentalResponsibility: "no",
    });
    expect(result).to.not.have.any.keys(
      "needsAdviceOnEUOrInternationalMaintenance",
      "needsProtectiveInjunction",
      "laspoEvidenceScope",
    );
  });
});
