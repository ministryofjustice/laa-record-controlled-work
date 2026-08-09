import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import config from "#/config.js";
import { logger } from "#/logger.js";
import { SaveApplicationMeansError } from "#/api/eligibility/eligibility.errors.js";
import {
  type SaveApplicationMeansDeps,
  saveApplicationMeans,
} from "#/api/eligibility/eligibility.service.js";

describe("saveApplicationMeans", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";

  let deps: SaveApplicationMeansDeps;
  let updateApplicationMeansStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    updateApplicationMeansStub = sinon.stub();
    deps = {
      updateApplicationMeans: updateApplicationMeansStub,
    } as unknown as SaveApplicationMeansDeps;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("splits the eligibility assessment and forwards data/result to the RCW API", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    const result = await saveApplicationMeans(deps, {
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

    const result = await saveApplicationMeans(deps, {
      eligibilityAssessment: {},
      homeAccountId: undefined,
      applicationId,
      sessionId: undefined,
    });

    expect(result.error).to.be.instanceOf(NotAuthenticatedError);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns a SaveApplicationMeansError failure when the RCW API does not return 204", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 500 });
    sinon.stub(logger, "error");

    const result = await saveApplicationMeans(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveApplicationMeansError);
  });

  it("returns a SaveApplicationMeansError failure when the RCW API returns 404", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 404 });
    sinon.stub(logger, "error");

    const result = await saveApplicationMeans(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveApplicationMeansError);
  });

  it("returns a SaveApplicationMeansError failure when the RCW API returns 409", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 409 });
    sinon.stub(logger, "error");

    const result = await saveApplicationMeans(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveApplicationMeansError);
  });

  it("returns a SaveApplicationMeansError failure when the RCW API call rejects", async () => {
    const cause = new Error("network error");
    updateApplicationMeansStub.rejects(cause);
    sinon.stub(logger, "error");

    const result = await saveApplicationMeans(deps, {
      eligibilityAssessment: {},
      homeAccountId: "home-account-id",
      applicationId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveApplicationMeansError);
    expect((result.error as SaveApplicationMeansError).cause).to.equal(cause);
  });

  it("defaults result to {} and forwards the full assessment as data when api_response is missing", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    await saveApplicationMeans(deps, {
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

    await saveApplicationMeans(deps, {
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

    await saveApplicationMeans(deps, {
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
