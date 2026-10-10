import { expect } from "chai";
import { describe, it } from "mocha";

import { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import { CreateApplicationRequestBody } from "#/api/clients/rcw/model/createApplicationRequestBody.zod.gen.js";
import { UpdateApplicationDetailsRequestBody } from "#/api/clients/rcw/model/updateApplicationDetailsRequestBody.zod.gen.js";

const application = {
  id: "7e3af2e9-12ca-4f6a-8c04-0d1c9c41a001",
  individualLegalAidNumber: "7e3af2e9-12ca-4f6a-8c04-0d1c9c41a002",
  providerFirmCode: "provider-firm",
  providerOfficeCode: "22439e72-68d3-4770-b435-c352d883d21e",
  clientDetails: {
    id: null,
    firstName: "",
    lastName: "",
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
  meansAssessmentRequired: null,
  typeOfNonMeans: null,
  contribution: null,
  scopingQuestions: null,
  applicationType: "new",
  createdAt: "2025-01-01T00:00:00Z",
  createdBy: "test-user",
  modifiedAt: "2025-01-01T00:00:00Z",
  modifiedBy: "test-user",
};

const nullableDetailsRequest = {
  priorLegalAid: "no",
  legalAidLast6Months: false,
  reasonForReapplication: null,
  ecfFlag: false,
  clientDetails: {
    firstName: "",
    lastName: "",
    dateOfBirth: "1990-01-01",
    niNumber: null,
    hasFixedAddress: true,
    address: {
      addressLine1: "",
      addressLine2: null,
      addressLine3: null,
      addressLine4: null,
      townOrCity: null,
      postCode: null,
      county: null,
      country: "GB",
    },
  },
};

describe("generated RCW contract", () => {
  it("accepts complete nullable details and preserves nulls and empty strings", () => {
    const parsed = UpdateApplicationDetailsRequestBody.parse(
      nullableDetailsRequest,
    );

    expect(parsed).to.deep.equal(nullableDetailsRequest);

    const noAddressRequest = {
      ...nullableDetailsRequest,
      clientDetails: {
        ...nullableDetailsRequest.clientDetails,
        hasFixedAddress: false,
        address: null,
      },
    };
    expect(
      UpdateApplicationDetailsRequestBody.parse(noAddressRequest),
    ).to.deep.equal(noAddressRequest);
  });

  it("rejects omitted required details and address keys", () => {
    const requiredDetailsKeys = [
      "priorLegalAid",
      "legalAidLast6Months",
      "reasonForReapplication",
      "ecfFlag",
      "clientDetails",
    ];
    const requiredClientKeys = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "niNumber",
      "hasFixedAddress",
      "address",
    ];
    const requiredAddressKeys = [
      "addressLine1",
      "addressLine2",
      "addressLine3",
      "addressLine4",
      "townOrCity",
      "postCode",
      "county",
      "country",
    ];

    for (const key of requiredDetailsKeys) {
      const omitted = Object.fromEntries(
        Object.entries(nullableDetailsRequest).filter(
          ([entryKey]) => entryKey !== key,
        ),
      );
      expect(UpdateApplicationDetailsRequestBody.safeParse(omitted).success).to
        .equal(false);
    }

    for (const key of requiredClientKeys) {
      const omittedClientDetails = Object.fromEntries(
        Object.entries(nullableDetailsRequest.clientDetails).filter(
          ([entryKey]) => entryKey !== key,
        ),
      );
      expect(
        UpdateApplicationDetailsRequestBody.safeParse({
          ...nullableDetailsRequest,
          clientDetails: omittedClientDetails,
        }).success,
      ).to.equal(false);
    }

    for (const key of requiredAddressKeys) {
      const omittedAddress = Object.fromEntries(
        Object.entries(nullableDetailsRequest.clientDetails.address).filter(
          ([entryKey]) => entryKey !== key,
        ),
      );
      expect(
        UpdateApplicationDetailsRequestBody.safeParse({
          ...nullableDetailsRequest,
          clientDetails: {
            ...nullableDetailsRequest.clientDetails,
            address: omittedAddress,
          },
        }).success,
      ).to.equal(false);
    }
  });

  it("accepts GET data with nullable ECF and scoping questions", () => {
    const parsed = Application.parse(application);

    expect(parsed.ecfFlag).to.equal(null);
    expect(parsed.scopingQuestions).to.equal(null);
  });

  it("retains GET scoping answers when prior legal aid is absent", () => {
    const parsed = Application.parse({
      ...application,
      scopingQuestions: {
        familyLawClassification: "private",
        needsAdviceOnEUOrInternationalMaintenance: true,
      },
    });

    expect(parsed.scopingQuestions).to.deep.equal({
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: true,
    });
  });

  it("keeps prior legal aid required for create requests", () => {
    const createRequest = {
      providerOfficeCode: "22439e72-68d3-4770-b435-c352d883d21e",
      scopingQuestions: { priorLegalAid: "no" },
      clientDetails: {
        firstName: "",
        lastName: "",
        dateOfBirth: "1990-01-01",
        hasFixedAddress: false,
      },
    };

    expect(CreateApplicationRequestBody.safeParse(createRequest).success).to
      .equal(true);
    expect(
      CreateApplicationRequestBody.safeParse({
        ...createRequest,
        scopingQuestions: {},
      }).success,
    ).to.equal(false);
  });
});