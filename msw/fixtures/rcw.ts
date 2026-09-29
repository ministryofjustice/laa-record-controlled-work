/* eslint-disable @typescript-eslint/no-magic-numbers -- super magic faker values */
import { faker } from "@faker-js/faker";

import {
  getCreateApplicationResponseMock,
  getGetApplicationResponseMock,
  getGetApplicationsResponseMock,
} from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

faker.seed(12345);

const CLIENT_DETAILS = {
  clientDetails: {
    address: {
      addressLine1: faker.location.streetAddress(),
      addressLine2: faker.location.secondaryAddress(),
      addressLine3: null,
      addressLine4: null,
      country: "GB",
      county: faker.location.county(),
      createdAt: `${faker.date.past().toISOString().slice(0, 19)}Z`,
      id: null,
      modifiedAt: `${faker.date.past().toISOString().slice(0, 19)}Z`,
      postCode: faker.location.zipCode("??# #??"),
      townOrCity: faker.location.city(),
    },
    createdAt: `${faker.date.past().toISOString().slice(0, 19)}Z`,
    dateOfBirth: faker.date
      .birthdate({ max: 90, min: 18, mode: "age" })
      .toISOString()
      .slice(0, 10),
    firstName: faker.person.firstName(),
    hasFixedAddress: true,
    id: faker.string.uuid(),
    lastName: faker.person.lastName(),
    modifiedAt: `${faker.date.past().toISOString().slice(0, 19)}Z`,
    niNumber: `AA${faker.string.numeric(6)}C`,
  },
  scopingQuestions: { priorLegalAid: "no" },
};

const DECLARATION = {
  declaration: {
    createdAt: faker.date.past().toISOString(),
    createdBy: faker.person.fullName(),
    dateSigned: faker.date.recent().toISOString().slice(0, 10),
    declarationConfirmation: true,
    id: faker.string.uuid(),
    modifiedAt: faker.date.recent().toISOString(),
    modifiedBy: faker.person.fullName(),
  },
};

const ELIGIBILITY = {
  eligibility: {
    data: null,
    result: {
      result_summary: { overall_result: { result: "eligible" } },
    },
  },
};

const EVIDENCE = {
  evidence: {
    evidenceExemptionCode: "none",
    evidenceExemptionReason: "Not exempt",
    expenditureCapitalEvidenceChecklist: { complete: true },
    incomeEvidenceChecklist: { complete: true },
  },
};

const APPLICATION_DETAILS = {
  applicationState: "COMPLETED" as const,
  providerOfficeCode: "R1XEVG",
};

export const applications = [...getGetApplicationsResponseMock()].sort((a, b) =>
  b.modifiedAt.localeCompare(a.modifiedAt),
);

export const createApplicationResponse = getCreateApplicationResponseMock();

export const incompleteApplication = getGetApplicationResponseMock({
  eligibility: null,
});

export const completeApplication = getGetApplicationResponseMock({
  ...APPLICATION_DETAILS,
  ...CLIENT_DETAILS,
  ...DECLARATION,
  ...ELIGIBILITY,
  ...EVIDENCE,
});

export const clientDetailsApplication =
  getGetApplicationResponseMock(CLIENT_DETAILS);
