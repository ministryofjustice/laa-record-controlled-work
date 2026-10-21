import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import {
  ApiResponseError,
  ApiValidationError,
} from "#/api/clients/api.errors.js";
import config from "#/config.js";
import { createApplication } from "#/journeys/create-application/effects/createApplication.js";
import type {
  CreateApplicationContext,
  CreateApplicationEffectsDeps,
} from "#/journeys/create-application/create-application.types.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { logger } from "#/logger.js";
import { getCreateApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { createValidApplicationAnswers } from "#tests/fixtures/application.fixtures.js";

describe("CreateApplicationEffect", () => {
  const journeyCode = "testJourney";
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";

  let context: CreateApplicationContext;
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
        [journeyCode]: createValidApplicationAnswers(),
        anotherJourney: { keep: "yes" },
      },
      selectedOffice: {
        address: "123 Test Street, Manchester, A12 3BC",
        code: "22439e72-68d3-4770-b435-c352d883d21e",
      },
    };
    getSession = sinon.stub().returns(session);

    context = {
      getRequestHeader: sinon.stub().returns("test-correlation-id"),
      getSession,
      setData,
    } as unknown as CreateApplicationContext;
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

  it("sends the complete create request without ECF", async () => {
    createApplicationStub.resolves({
      data: getCreateApplicationResponseMock({ id: applicationId }),
      status: 201,
      headers: new Headers(),
    });

    await createApplication(deps)(context, journeyCode);

    expect(createApplicationStub.calledOnce).to.equal(true);
    expect(createApplicationStub.firstCall.args[0]).to.deep.equal({
      clientDetails: {
        firstName: "Jane",
        lastName: "Bloggs",
        dateOfBirth: "1990-01-01",
        niNumber: "AB123456C", // gitleaks:allow - fake NI number used in test fixture
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
      providerOfficeCode: "22439e72-68d3-4770-b435-c352d883d21e",
      reasonForReapplication: "here is a reason",
      scopingQuestions: {
        priorLegalAid: "yesSameMatter",
        familyLawClassification: "public",
        careProceedingsStarted: false,
        caseMeetsMeritsCriteria: true,
      },
    });
    expect(createApplicationStub.firstCall.args[0]).not.to.have.property(
      "ecfFlag",
    );
  });

  it("sends only reached private answers and always sends positive merits", async () => {
    session.journeyDrafts[journeyCode] = {
      ...(session.journeyDrafts[journeyCode] as Record<string, unknown>),
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: "yes",
      needsProtectiveInjunction: "no",
      laspoEvidenceScope: "domesticAbuse",
    };
    createApplicationStub.resolves({
      data: getCreateApplicationResponseMock({ id: applicationId }),
      status: 201,
      headers: new Headers(),
    });

    await createApplication(deps)(context, journeyCode);

    expect(
      createApplicationStub.firstCall.args[0].scopingQuestions,
    ).to.deep.equal({
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: true,
      caseMeetsMeritsCriteria: true,
    });
  });

  it("submits a reached private LASPO evidence scope", async () => {
    session.journeyDrafts[journeyCode] = {
      ...(session.journeyDrafts[journeyCode] as Record<string, unknown>),
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: "no",
      needsProtectiveInjunction: "no",
      laspoEvidenceScope: "domesticAbuse",
    };
    createApplicationStub.resolves({
      data: getCreateApplicationResponseMock({ id: applicationId }),
      status: 201,
      headers: new Headers(),
    });

    await createApplication(deps)(context, journeyCode);

    expect(
      createApplicationStub.firstCall.args[0].scopingQuestions,
    ).to.deep.equal({
      priorLegalAid: "yesSameMatter",
      familyLawClassification: "private",
      needsAdviceOnEUOrInternationalMaintenance: false,
      needsProtectiveInjunction: false,
      laspoEvidenceScope: "domesticAbuse",
      caseMeetsMeritsCriteria: true,
    });
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
        [journeyCode]: createValidApplicationAnswers(),
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
