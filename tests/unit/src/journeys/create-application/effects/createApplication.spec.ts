import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";
import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import {
  ApiResponseError,
  ApiValidationError,
} from "#/api/clients/api.errors.js";
import config from "#/config.js";
import { createApplication } from "#/journeys/create-application/effects/createApplication.js";
import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { logger } from "#/logger.js";
import { getCreateApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

describe("CreateApplicationEffect", () => {
  const journeyCode = "testJourney";
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";

  let context: EffectFunctionContext;
  let createApplicationStub: sinon.SinonStub;
  let deps: CreateApplicationEffectsDeps;
  let getSession: sinon.SinonStub;
  let setData: sinon.SinonStub;
  let session: {
    journeyDrafts: Record<string, unknown>;
    selectedOffice?: { address: string; code: string };
  };

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    createApplicationStub = sinon.stub();
    deps = {
      createApplication: createApplicationStub,
    } as unknown as CreateApplicationEffectsDeps;
    setData = sinon.stub();
    session = {
      journeyDrafts: {
        [journeyCode]: {
          ukAddressLine1: "123 Test Street",
          ukCountry: "United Kingdom",
          dateOfBirth: "1990-01-01",
          ecf: "no",
          firstName: "Jane",
          hasNINumber: "yes",
          haveAHomeAddress: "yes",
          lastName: "Bloggs",
          legalAidBefore: "yesSameMatter",
          legalAidLast6Months: "yes",
          niNumber: "AB123456C", // gitleaks:allow - fake NI number used in test fixture
          ukPostcode: "A12 3BC",
          reasonForYes: "here is a reason",
          ukTownOrCity: "Manchester",
        },
        anotherJourney: { keep: "yes" },
      },
      selectedOffice: {
        address: "123 Test Street, Manchester, A12 3BC",
        code: "22439e72-68d3-4770-b435-c352d883d21e",
      },
    };
    getSession = sinon.stub().returns(session);

    context = {
      getSession,
      setData,
    } as unknown as EffectFunctionContext;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("sets applicationID in context from createApplication response", async () => {
    createApplicationStub.resolves({
      data: getCreateApplicationResponseMock({ id: applicationId }),
      status: 201,
      headers: new Headers(),
    });

    await createApplication(deps)(context, journeyCode);

    expect(createApplicationStub.calledOnce).to.equal(true);
    expect(
      setData.calledOnceWithExactly(
        CONTEXT_DATA_KEYS.applicationID,
        applicationId,
      ),
    ).to.equal(true);

    expect(session.journeyDrafts[journeyCode]).to.be.undefined;
    expect(session.journeyDrafts.anotherJourney).to.deep.equal({ keep: "yes" });
  });

  it("returns an ApiResponseError when createApplication responds with non-201", async () => {
    createApplicationStub.resolves({
      status: 500,
      data: {},
      headers: new Headers(),
    });
    sinon.stub(logger, "error");

    try {
      await createApplication(deps)(context, journeyCode);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }

    expect(session.journeyDrafts[journeyCode]).to.exist;
  });

  it("returns an ApiResponseError when createApplication rejects", async () => {
    const cause = new Error("network error");
    createApplicationStub.rejects(cause);
    sinon.stub(logger, "error");

    try {
      await createApplication(deps)(context, journeyCode);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      const apiError = error as ApiResponseError;
      expect(apiError.cause).to.equal(cause);
    }

    expect(session.journeyDrafts[journeyCode]).to.exist;
  });

  it("returns an ApiValidationError when createApplication returns no application id", async () => {
    createApplicationStub.resolves({
      headers: new Headers(),
      status: 201,
    });
    sinon.stub(logger, "error");

    try {
      await createApplication(deps)(context, journeyCode);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiValidationError);
    }

    expect(session.journeyDrafts[journeyCode]).to.exist;
  });

  it("returns an ApiResponseError with ApiValidationError cause when selected office is missing", async () => {
    getSession.returns({
      journeyDrafts: {
        [journeyCode]: {
          ukAddressLine1: "123 Test Street",
          ukCountry: "United Kingdom",
          dateOfBirth: "1990-01-01",
          ecf: "no",
          firstName: "Jane",
          hasNINumber: "yes",
          haveAHomeAddress: "yes",
          lastName: "Bloggs",
          legalAidBefore: "yesSameMatter",
          legalAidLast6Months: "yes",
          niNumber: "AB123456C", // gitleaks:allow - fake NI number used in test fixture
          ukPostcode: "A12 3BC",
          reasonForYes: "here is a reason",
          ukTownOrCity: "Manchester",
        },
      },
    });

    sinon.stub(logger, "error");

    try {
      await createApplication(deps)(context, journeyCode);
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      const apiError = error as ApiResponseError;
      expect(apiError.cause).to.be.instanceOf(ApiValidationError);
      expect(createApplicationStub.called).to.equal(false);
    }
  });

  it("returns an ApiResponseError with ApiValidationError cause when journey answers are invalid", async () => {
    getSession.returns({
      journeyDrafts: {
        [journeyCode]: {
          firstName: "Jane",
        },
      },
    });

    sinon.stub(logger, "error");

    try {
      await createApplication(deps)(context, journeyCode);
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      const apiError = error as ApiResponseError;
      expect(apiError.cause).to.be.instanceOf(ApiValidationError);
      expect(createApplicationStub.called).to.equal(false);
    }
  });
});
