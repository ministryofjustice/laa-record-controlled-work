import type { Application } from "express";

import request from "supertest";

import { expect } from "chai";
import sinon from "sinon";

import config from "#/config.js";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  OK,
  UNAUTHORIZED,
} from "#/lib/constants/http.js";
import { logger } from "#/logger.js";
import { createEligibilityRouter } from "#/api/eligibility/eligibility.routes.js";
import { getGetApplicationResponseMock } from "../../../../mocks/api/rcw/fakers/applications/applications.faker.gen.js";
import { createMockApp } from "../../../utils.js";

const MOUNT_PATH = "/api/applications/:applicationId/eligibility";
const resourceId = "123e4567-e89b-12d3-a456-426614174000";

function eligibilityPath(applicationId: string): string {
  return `/api/applications/${applicationId}/eligibility`;
}

describe("GET /api/applications/:applicationId/eligibility", () => {
  let getApplicationStub: sinon.SinonStub;

  function buildApp(): Application {
    return createMockApp({
      mountPath: MOUNT_PATH,
      router: createEligibilityRouter({
        getApplication: getApplicationStub,
        updateApplicationMeans: sinon.stub(),
      }),
      useCsrf: false,
    });
  }

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    getApplicationStub = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns 400 when applicationId is not a valid UUID", async () => {
    const response = await request(buildApp()).get(
      eligibilityPath("not-a-uuid"),
    );

    expect(response.status).to.equal(BAD_REQUEST);
    expect(getApplicationStub.called).to.equal(false);
  });

  it("returns an empty body when the application has no eligibility assessment", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({
        id: resourceId,
        eligibility: undefined,
      }),
      status: 200,
    });

    const response = await request(buildApp()).get(
      eligibilityPath(resourceId),
    );

    expect(response.status).to.equal(OK);
    expect(response.body).to.deep.equal({});
  });

  it("returns data/result when a completed assessment is present", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({
        id: resourceId,
        eligibility: {
          data: { level_of_help: "controlled_legal_representation" },
          result: { indication: true },
        },
      }),
      status: 200,
    });

    const response = await request(buildApp()).get(
      eligibilityPath(resourceId),
    );

    expect(response.status).to.equal(OK);
    expect(response.body).to.deep.equal({
      data: { level_of_help: "controlled_legal_representation" },
      result: { indication: true },
    });
  });

  it("returns an empty body when the eligibility assessment is malformed or partial", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({
        id: resourceId,
        eligibility: { data: { level_of_help: "cw" }, result: undefined },
      }),
      status: 200,
    });

    const response = await request(buildApp()).get(
      eligibilityPath(resourceId),
    );

    expect(response.status).to.equal(OK);
    expect(response.body).to.deep.equal({});
  });

  it("returns 401 when the session cannot be authenticated", async () => {
    sinon.stub(config.api, "useMockAccessToken").value(false);

    const response = await request(buildApp()).get(
      eligibilityPath(resourceId),
    );

    expect(response.status).to.equal(UNAUTHORIZED);
    expect(getApplicationStub.called).to.equal(false);
  });

  it("surfaces a 5xx when the RCW API call fails", async () => {
    getApplicationStub.resolves({ data: undefined, status: 500 });
    sinon.stub(logger, "error");

    const response = await request(buildApp()).get(
      eligibilityPath(resourceId),
    );

    expect(response.status).to.equal(INTERNAL_SERVER_ERROR);
  });
});

describe("PUT /api/applications/:applicationId/eligibility", () => {
  let updateApplicationMeansStub: sinon.SinonStub;

  function buildApp(): Application {
    return createMockApp({
      mountPath: MOUNT_PATH,
      router: createEligibilityRouter({
        getApplication: sinon.stub(),
        updateApplicationMeans: updateApplicationMeansStub,
      }),
      useCsrf: false,
    });
  }

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    updateApplicationMeansStub = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns 400 when the request body fails validation", async () => {
    const response = await request(buildApp())
      .put(eligibilityPath(resourceId))
      .send({});

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when applicationId is not a valid UUID", async () => {
    const response = await request(buildApp())
      .put(eligibilityPath("not-a-uuid"))
      .send({ eligibility_assessment: {} });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when eligibility_assessment is missing", async () => {
    const response = await request(buildApp())
      .put(eligibilityPath(resourceId))
      .send({});

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when eligibility_assessment is a string", async () => {
    const response = await request(buildApp())
      .put(eligibilityPath(resourceId))
      .send({ eligibility_assessment: "not-an-object" });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when eligibility_assessment is an array", async () => {
    const response = await request(buildApp())
      .put(eligibilityPath(resourceId))
      .send({ eligibility_assessment: [] });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when eligibility_assessment is null", async () => {
    const response = await request(buildApp())
      .put(eligibilityPath(resourceId))
      .send({ eligibility_assessment: null });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 for a malformed JSON body", async () => {
    const response = await request(buildApp())
      .put(eligibilityPath(resourceId))
      .set("Content-Type", "application/json")
      .send("{not valid json");

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 200 and forwards the split payload to the RCW API on success", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    const response = await request(buildApp())
      .put(eligibilityPath(resourceId))
      .send({
        eligibility_assessment: {
          api_response: { indication: true },
          level_of_help: "controlled_legal_representation",
        },
      });

    expect(response.status).to.equal(OK);
    expect(
      updateApplicationMeansStub.calledOnceWith(resourceId, {
        data: { level_of_help: "controlled_legal_representation" },
        result: { indication: true },
      }),
    ).to.equal(true);
  });

  it("returns 401 when the session cannot be authenticated", async () => {
    sinon.stub(config.api, "useMockAccessToken").value(false);

    const response = await request(buildApp())
      .put(eligibilityPath(resourceId))
      .send({ eligibility_assessment: {} });

    expect(response.status).to.equal(UNAUTHORIZED);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("surfaces a 5xx when the RCW API call fails", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 500 });
    sinon.stub(logger, "error");

    const response = await request(buildApp())
      .put(eligibilityPath(resourceId))
      .send({ eligibility_assessment: {} });

    expect(response.status).to.equal(INTERNAL_SERVER_ERROR);
  });
});
