/* eslint-disable @typescript-eslint/no-magic-numbers -- super magic faker values */
import { faker } from "@faker-js/faker";
import { randomUUID } from "node:crypto";

import { FamilyLawClassification } from "#/api/clients/rcw/model/familyLawClassification.zod.gen.js";
import { LaspoEvidenceScope } from "#/api/clients/rcw/model/laspoEvidenceScope.zod.gen.js";
import { PriorLegalAid } from "#/api/clients/rcw/model/priorLegalAid.zod.gen.js";
import {
  getCreateApplicationResponseMock,
  getGetApplicationResponseMock,
  getGetApplicationsResponseMock,
} from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

faker.seed(12345);

const CLIENT_DETAILS_TEST_APPLICATION_ID_PREFIX = "d3490000";

/** Creates a unique UUID in the client-details browser-test namespace.
 * @returns An application ID reserved for an isolated browser test.
 */
export function createClientDetailsTestApplicationId(): string {
  return `${CLIENT_DETAILS_TEST_APPLICATION_ID_PREFIX}${randomUUID().slice(8)}`;
}

/**
 * Checks whether an application ID belongs to the isolated test namespace.
 * @param id - Application ID to check.
 * @returns Whether the ID belongs to the test namespace.
 */
export function isClientDetailsTestApplicationId(id: string): boolean {
  return id.startsWith(`${CLIENT_DETAILS_TEST_APPLICATION_ID_PREFIX}-`);
}

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
  scopingQuestions: {
    familyLawClassification: FamilyLawClassification.enum.private,
    laspoEvidenceScope: LaspoEvidenceScope.enum.domesticAbuse,
    needsAdviceOnEUOrInternationalMaintenance: false,
    needsProtectiveInjunction: false,
    priorLegalAid: PriorLegalAid.enum.no,
  },
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
    data: {
      additional_property_owned: "none",
      adult_dependants: false,
      bank_accounts: [],
      child_dependants: false,
      childcare_payments_relevant: false,
      client_age: "standard",
      employment_status: "unemployed",
      friends_or_family_relevant: false,
      housing_benefit_relevant: false,
      housing_payments: 0,
      immigration_or_asylum: false,
      investments_relevant: false,
      legal_aid_payments_relevant: false,
      level_of_help: "controlled",
      maintenance_payments_relevant: false,
      maintenance_relevant: false,
      other_relevant: false,
      partner: false,
      passporting: false,
      pension_relevant: false,
      property_or_lodger_relevant: false,
      property_owned: "none",
      receives_benefits: false,
      student_finance_relevant: false,
      valuables_relevant: false,
    },
    result: {
      result_summary: {
        capital: {
          combined_assessed_capital: 700,
          proceeding_types: [{ result: "eligible", upper_threshold: 3000 }],
        },
        disposable_income: {
          combined_total_disposable_income: 108,
          proceeding_types: [{ result: "eligible", upper_threshold: 733 }],
        },
        gross_income: {
          combined_total_gross_income: 2450,
          proceeding_types: [{ result: "eligible", upper_threshold: 2657 }],
        },
        overall_result: { result: "eligible" },
      },
    },
  },
  meansAssessmentRequired: true,
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

export const clientDetailsApplication = getGetApplicationResponseMock({
  ...CLIENT_DETAILS,
  ecfFlag: null,
});
