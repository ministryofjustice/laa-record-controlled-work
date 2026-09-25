/* eslint-disable @typescript-eslint/no-magic-numbers -- super magic faker values */
import { faker } from "@faker-js/faker";

import {
  getCreateApplicationResponseMock,
  getGetApplicationResponseMock,
  getGetApplicationsResponseMock,
} from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

faker.seed(12345);

export const applications = [...getGetApplicationsResponseMock()].sort((a, b) =>
  b.modifiedAt.localeCompare(a.modifiedAt),
);

export const createApplicationResponse = getCreateApplicationResponseMock();

export const incompleteApplication = getGetApplicationResponseMock({
  eligibility: null,
});

export const completeApplication = getGetApplicationResponseMock({
  declaration: {
    createdAt: null,
    createdBy: null,
    dateSigned: null,
    declarationConfirmation: true,
    id: null,
    modifiedAt: null,
    modifiedBy: null,
  },
  eligibility: {
    data: null,
    result: {
      result_summary: { overall_result: { result: "eligible" } },
    },
  },
  evidence: {
    evidenceExemptionCode: "none",
    evidenceExemptionReason: "Not exempt",
    expenditureCapitalEvidenceChecklist: { complete: true },
    incomeEvidenceChecklist: { complete: true },
  },
  providerOfficeCode: "R1XEVG",
});

export const clientDetailsApplication = getGetApplicationResponseMock({
  clientDetails: {
    address: {
      addressLine1: "1 test lane",
      addressLine2: "test area",
      addressLine3: null,
      addressLine4: null,
      country: "GB",
      county: "Test County",
      createdAt: `${faker.date.past().toISOString().slice(0, 19)}Z`,
      id: null,
      modifiedAt: `${faker.date.past().toISOString().slice(0, 19)}Z`,
      postCode: "TE57 1NG",
      townOrCity: "Test Town",
    },
    createdAt: `${faker.date.past().toISOString().slice(0, 19)}Z`,
    dateOfBirth: faker.date.past().toISOString().slice(0, 10),
    firstName: faker.string.alpha({ length: { max: 20, min: 10 } }),
    hasFixedAddress: true,
    id: faker.string.uuid(),
    lastName: faker.string.alpha({ length: { max: 20, min: 10 } }),
    modifiedAt: `${faker.date.past().toISOString().slice(0, 19)}Z`,
    niNumber: "AA123456C", // gitleaks:allow - fake NI number used in test fixture
  },
  scopingQuestions: { priorLegalAid: "no" },
});
