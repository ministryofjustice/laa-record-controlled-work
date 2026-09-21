import { faker } from "@faker-js/faker";

import {
  getCreateApplicationResponseMock,
  getGetApplicationResponseMock,
  getGetApplicationsResponseMock,
} from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- deterministic test fixtures
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
      id: faker.string.uuid(),
      firstName: faker.string.alpha({ length: { min: 10, max: 20 } }),
      lastName: faker.string.alpha({ length: { min: 10, max: 20 } }),
      dateOfBirth: faker.date.past().toISOString().slice(0, 10),
      niNumber: faker.helpers.fromRegExp(
        "[A-CEGHJ-NOPR-TW-Z]{2}[0-9]{6}[ABCDs]{1}",
      ),
      hasFixedAddress: true,
      address: {
        id: null,
        addressLine1: "1 test lane",
        addressLine2: "test area",
        addressLine3: null,
        addressLine4: null,
        townOrCity: "Test Town",
        postCode: "TE57 1NG",
        county: "Test County",
        country: "GB",
        createdAt: faker.date.past().toISOString().slice(0, 19) + "Z",
        modifiedAt: faker.date.past().toISOString().slice(0, 19) + "Z",
      },
      createdAt: faker.date.past().toISOString().slice(0, 19) + "Z",
      modifiedAt: faker.date.past().toISOString().slice(0, 19) + "Z",
    },
});
