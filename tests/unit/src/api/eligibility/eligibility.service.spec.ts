import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import config from "#/config.js";
import type { Success } from "#/lib/either.js";
import { logger } from "#/logger.js";
import {
  LoadEligibilityAssessmentError,
  SaveEligibilityAssessmentError,
} from "#/api/eligibility/eligibility.errors.js";
import {
  type EligibilityAssessment,
  type LoadEligibilityAssessmentDeps,
  type SaveEligibilityAssessmentDeps,
  loadEligibilityAssessment,
  saveEligibilityAssessment,
} from "#/api/eligibility/eligibility.service.js";
import { getGetApplicationResponseMock } from "../../../../mocks/api/rcw/fakers/applications/applications.faker.gen.js";

describe("saveEligibilityAssessment", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";

  let deps: SaveEligibilityAssessmentDeps;
  let updateApplicationMeansStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    updateApplicationMeansStub = sinon.stub();
    deps = {
      updateApplicationMeans: updateApplicationMeansStub,
    } as unknown as SaveEligibilityAssessmentDeps;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("splits the eligibility assessment and forwards data/result to the RCW API", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {
        api_response: { indication: true },
        level_of_help: "controlled_legal_representation",
      },
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.equal(undefined);
    expect(
      updateApplicationMeansStub.calledOnceWith(applicationId, {
        data: { level_of_help: "controlled_legal_representation" },
        result: { indication: true },
      }),
    ).to.equal(true);
  });

  it("returns a NotAuthenticatedError failure when the session cannot be authenticated", async () => {
    sinon.stub(config.api, "useMockAccessToken").value(false);

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: undefined,
      applicationId,
      sessionId: undefined,
    });

    expect(result.error).to.be.instanceOf(NotAuthenticatedError);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns a SaveEligibilityAssessmentError failure when the RCW API does not return 204", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 500 });
    sinon.stub(logger, "error");

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveEligibilityAssessmentError);
  });

  it("returns a SaveEligibilityAssessmentError failure when the RCW API returns 404", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 404 });
    sinon.stub(logger, "error");

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveEligibilityAssessmentError);
  });

  it("returns a SaveEligibilityAssessmentError failure when the RCW API returns 409", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 409 });
    sinon.stub(logger, "error");

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveEligibilityAssessmentError);
  });

  it("returns a SaveEligibilityAssessmentError failure when the RCW API call rejects", async () => {
    const cause = new Error("network error");
    updateApplicationMeansStub.rejects(cause);
    sinon.stub(logger, "error");

    const result = await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveEligibilityAssessmentError);
    expect((result.error as SaveEligibilityAssessmentError).cause).to.equal(
      cause,
    );
  });

  it("defaults result to {} and forwards the full assessment as data when api_response is missing", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    await saveEligibilityAssessment(deps, {
      eligibilityAssessment: { level_of_help: "controlled_legal_representation" },
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(
      updateApplicationMeansStub.calledOnceWith(applicationId, {
        data: { level_of_help: "controlled_legal_representation" },
        result: {},
      }),
    ).to.equal(true);
  });

  it("defaults result to {} when api_response is not an object", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    await saveEligibilityAssessment(deps, {
      eligibilityAssessment: { api_response: "not-an-object" },
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(
      updateApplicationMeansStub.calledOnceWith(applicationId, {
        data: {},
        result: {},
      }),
    ).to.equal(true);
  });

  it("defaults both data and result to {} when eligibility_assessment is empty", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    await saveEligibilityAssessment(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(
      updateApplicationMeansStub.calledOnceWith(applicationId, {
        data: {},
        result: {},
      }),
    ).to.equal(true);
  });
});

describe("loadEligibilityAssessment", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";

  let deps: LoadEligibilityAssessmentDeps;
  let getApplicationStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    getApplicationStub = sinon.stub();
    deps = {
      getApplication: getApplicationStub,
    } as unknown as LoadEligibilityAssessmentDeps;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns the eligibility data/result when a completed assessment is present", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({
        id: applicationId,
        eligibility: {
          data: { level_of_help: "controlled_legal_representation" },
          result: { indication: true },
        },
      }),
      status: 200,
    });

    const result = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment | undefined>;

    expect(result.error).to.equal(undefined);
    expect(result.value).to.deep.equal({
      data: { level_of_help: "controlled_legal_representation" },
      result: { indication: true },
    });
  });

  it("returns undefined when the application has no eligibility assessment", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({
        id: applicationId,
        eligibility: undefined,
      }),
      status: 200,
    });

    const result = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment | undefined>;

    expect(result.error).to.equal(undefined);
    expect(result.value).to.equal(undefined);
  });

  it("returns undefined when eligibility data/result is malformed or partial", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({
        id: applicationId,
        eligibility: { data: { level_of_help: "cw" }, result: undefined },
      }),
      status: 200,
    });

    const result = (await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    })) as Success<EligibilityAssessment | undefined>;

    expect(result.error).to.equal(undefined);
    expect(result.value).to.equal(undefined);
  });

  it("returns a NotAuthenticatedError failure when the session cannot be authenticated", async () => {
    sinon.stub(config.api, "useMockAccessToken").value(false);

    const result = await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: undefined,
      sessionId: undefined,
    });

    expect(result.error).to.be.instanceOf(NotAuthenticatedError);
    expect(getApplicationStub.called).to.equal(false);
  });

  it("returns a LoadEligibilityAssessmentError failure when the RCW API does not return 200", async () => {
    getApplicationStub.resolves({ data: undefined, status: 404 });
    sinon.stub(logger, "error");

    const result = await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(LoadEligibilityAssessmentError);
  });

  it("returns a LoadEligibilityAssessmentError failure when the RCW API call rejects", async () => {
    const cause = new Error("network error");
    getApplicationStub.rejects(cause);
    sinon.stub(logger, "error");

    const result = await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(LoadEligibilityAssessmentError);
    expect((result.error as LoadEligibilityAssessmentError).cause).to.equal(
      cause,
    );
  });

  it("returns a LoadEligibilityAssessmentError failure when the response fails validation", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({ id: "not-a-uuid" }),
      status: 200,
    });
    sinon.stub(logger, "error");

    const result = await loadEligibilityAssessment(deps, {
      applicationId,
      homeAccountId: "home-account-id",
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(LoadEligibilityAssessmentError);
  });
});
