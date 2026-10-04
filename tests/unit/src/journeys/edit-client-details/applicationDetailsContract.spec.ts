import { expect } from "chai";
import { describe, it } from "mocha";

import { Application as ApplicationSchema } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import { CreateApplicationRequestBody } from "#/api/clients/rcw/model/createApplicationRequestBody.zod.gen.js";
import { UpdateApplicationDetailsRequestBody } from "#/api/clients/rcw/model/updateApplicationDetailsRequestBody.zod.gen.js";

const updateRequest = {
  priorLegalAid: "no",
  legalAidLast6Months: false,
  reasonForReapplication: null,
  ecfFlag: true,
  clientDetails: {
    firstName: "Test",
    lastName: "Client",
    dateOfBirth: "1990-01-01",
    niNumber: null,
    hasFixedAddress: true,
    address: {
      addressLine1: "1 Example Street",
      addressLine2: "",
      addressLine3: null,
      addressLine4: null,
      townOrCity: "Example Town",
      postCode: null,
      county: null,
      country: "GB",
    },
  },
};

const application = {
  id: "00000000-0000-4000-8000-000000000001",
  individualLegalAidNumber: "00000000-0000-4000-8000-000000000002",
  providerFirmCode: "test-provider",
  providerOfficeCode: "00000000-0000-0000-0000-000000000003",
  clientDetails: {
    id: null,
    firstName: "Test",
    lastName: "Client",
    dateOfBirth: "1990-01-01",
    niNumber: null,
    hasFixedAddress: false,
    address: null,
    createdAt: null,
    modifiedAt: null,
  },
  applicationState: "DRAFT",
  declaration: null,
  evidence: null,
  eligibility: null,
  reasonForReapplication: null,
  ecfFlag: null,
  scopingQuestions: null,
  applicationType: "new",
  createdAt: "2025-01-01T00:00:00Z",
  createdBy: "test-user",
  modifiedAt: "2025-01-01T00:00:00Z",
  modifiedBy: "test-user",
} satisfies Application;

const omit = (source: object, key: string): Record<string, unknown> =>
  Object.fromEntries(Object.entries(source).filter(([name]) => name !== key));

describe("RCW application details contracts", () => {
  it("accepts complete nullable details and preserves null and empty strings in JSON", () => {
    const parsed = UpdateApplicationDetailsRequestBody.parse(updateRequest);
    const serialized = JSON.parse(JSON.stringify(parsed));

    expect(serialized).to.deep.equal(updateRequest);
  });

  it("rejects omitted required nullable details", () => {
    const omittedAddressFields = [
      "addressLine2",
      "addressLine3",
      "addressLine4",
      "townOrCity",
      "postCode",
      "county",
    ].map((field) => ({
      ...updateRequest,
      clientDetails: {
        ...updateRequest.clientDetails,
        address: omit(updateRequest.clientDetails.address, field),
      },
    }));

    const invalidRequests = [
      omit(updateRequest, "reasonForReapplication"),
      {
        ...updateRequest,
        clientDetails: omit(updateRequest.clientDetails, "niNumber"),
      },
      {
        ...updateRequest,
        clientDetails: omit(updateRequest.clientDetails, "address"),
      },
      ...omittedAddressFields,
    ];

    for (const request of invalidRequests) {
      expect(
        UpdateApplicationDetailsRequestBody.safeParse(request).success,
      ).to.equal(false);
    }
  });

  it("accepts a null address when the client has no fixed address", () => {
    const request = {
      ...updateRequest,
      clientDetails: {
        ...updateRequest.clientDetails,
        hasFixedAddress: false,
        address: null,
      },
    };

    expect(
      UpdateApplicationDetailsRequestBody.safeParse(request).success,
    ).to.equal(true);
  });

  it("accepts existing GET values with null scoping and ECF data", () => {
    const parsed = ApplicationSchema.parse(application);

    expect(parsed.scopingQuestions).to.equal(null);
    expect(parsed.ecfFlag).to.equal(null);
  });

  it("retains family-law classification when prior legal aid is absent", () => {
    const parsed = ApplicationSchema.parse({
      ...application,
      scopingQuestions: { familyLawClassification: "private" },
    });

    expect(parsed.scopingQuestions).to.deep.equal({
      familyLawClassification: "private",
    });
  });

  it("keeps prior legal aid required for create requests", () => {
    const createRequest = {
      legalAidBefore: "no",
      providerOfficeCode: "00000000-0000-0000-0000-000000000003",
      scopingQuestions: {
        priorLegalAid: "no",
        familyLawClassification: "public",
      },
      clientDetails: {
        firstName: "Test",
        lastName: "Client",
        dateOfBirth: "1990-01-01",
        hasFixedAddress: false,
      },
    };
    const withoutPriorLegalAid = {
      ...createRequest,
      scopingQuestions: omit(createRequest.scopingQuestions, "priorLegalAid"),
    };
    const withoutFamilyLawClassification = {
      ...createRequest,
      scopingQuestions: omit(
        createRequest.scopingQuestions,
        "familyLawClassification",
      ),
    };

    expect(
      CreateApplicationRequestBody.safeParse(createRequest).success,
    ).to.equal(true);
    expect(
      CreateApplicationRequestBody.safeParse(
        omit(createRequest, "legalAidBefore"),
      ).success,
    ).to.equal(false);
    expect(
      CreateApplicationRequestBody.safeParse(withoutPriorLegalAid).success,
    ).to.equal(false);
    expect(
      CreateApplicationRequestBody.safeParse(withoutFamilyLawClassification)
        .success,
    ).to.equal(false);
  });
});
