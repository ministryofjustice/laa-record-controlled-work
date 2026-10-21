import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { Answers } from "#/journeys/create-application/data/answers.zod.js";

import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

type SavedApplicationOverrides = Omit<Partial<Application>, "clientDetails"> & {
  clientDetails?: Partial<Application["clientDetails"]>;
};

export const DEFAULT_SAVED_APPLICATION_OVERRIDES = {
  clientDetails: {
    address: {
      addressLine1: "123 Test Street",
      addressLine2: "Test Area",
      addressLine3: null,
      addressLine4: null,
      country: "GB",
      county: "Greater Manchester",
      createdAt: null,
      id: null,
      modifiedAt: null,
      postCode: "A12 3BC",
      townOrCity: "Manchester",
    },
    createdAt: null,
    dateOfBirth: "1990-01-01",
    firstName: "Jane",
    hasFixedAddress: true,
    id: null,
    lastName: "Bloggs",
    modifiedAt: null,
    niNumber: null,
  },
  ecfFlag: null,
  providerOfficeCode: "test-office",
  reasonForReapplication: null,
  scopingQuestions: {
    familyLawClassification: "public",
    priorLegalAid: "yesSameMatter",
  },
} satisfies SavedApplicationOverrides;

/**
 * Creates a stable saved Application with fresh nested data.
 * @param overrides - Application fields that differ from the defaults.
 * @returns A fresh Application input for saved-answer tests.
 */
export function createSavedApplication(
  overrides: SavedApplicationOverrides = {},
): Application {
  const application = getGetApplicationResponseMock(
    DEFAULT_SAVED_APPLICATION_OVERRIDES,
  );

  return structuredClone({
    ...application,
    ...overrides,
    clientDetails: {
      ...application.clientDetails,
      ...overrides.clientDetails,
    },
  });
}

/**
 * Creates complete journey answers with explicit scenario overrides.
 * @param overrides - Answer fields that differ from the valid defaults.
 * @returns A fresh answer object for conversion tests.
 */
export function createValidApplicationAnswers(
  overrides: Partial<Answers> = {},
): Answers {
  return {
    careProceedingsStarted: "no",
    dateOfBirth: "1990-01-01",
    ecf: "yes",
    familyLawClassification: "public",
    firstName: "Jane",
    hasNINumber: "yes",
    haveAHomeAddress: "yes",
    lastName: "Bloggs",
    legalAidBefore: "yesSameMatter",
    legalAidLast6Months: "yes",
    niNumber: "AB123456C", // gitleaks:allow - fake NI number used in test fixture
    reasonForYes: "  here is a reason  ",
    ukAddressLine1: "123 Test Street",
    ukAddressLine2: "Test Area",
    ukCountry: "United Kingdom",
    ukCounty: "Greater Manchester",
    ukPostcode: "A12 3BC",
    ukTownOrCity: "Manchester",
    ...overrides,
  };
}
