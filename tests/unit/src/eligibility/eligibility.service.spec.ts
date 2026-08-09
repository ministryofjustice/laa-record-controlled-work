import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import config from "#/config.js";
import { logger } from "#/logger.js";
import { SaveApplicationMeansError } from "#/eligibility/eligibility.errors.js";
import {
  type SaveApplicationMeansDeps,
  saveApplicationMeans,
} from "#/eligibility/eligibility.service.js";

describe("saveApplicationMeans", () => {
  const resourceId = "123e4567-e89b-12d3-a456-426614174000";

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
      resourceId,
      sessionId: "session-id",
    });

    expect(result.error).to.equal(undefined);
    expect(
      updateApplicationMeansStub.calledOnceWith(resourceId, {
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
      resourceId,
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
      resourceId,
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
      resourceId,
      sessionId: "session-id",
    });

    expect(result.error).to.be.instanceOf(SaveApplicationMeansError);
    expect((result.error as SaveApplicationMeansError).cause).to.equal(cause);
  });
});
