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
import eligibilityRouter, {
  createEligibilityRouter,
} from "#/api/eligibility/eligibility.routes.js";
import { createMockApp } from "../../../utils.js";

describe("eligibilityRouter", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("returns 200 for GET /api/private/load", async () => {
    const app = createMockApp({
      mountPath: "/api/private",
      router: eligibilityRouter,
      useCsrf: false,
    });

    const response = await request(app).get("/api/private/load");

    expect(response.status).to.equal(OK);
  });
});

describe("POST /api/private/save", () => {
  const resourceId = "123e4567-e89b-12d3-a456-426614174000";

  let updateApplicationMeansStub: sinon.SinonStub;

  function buildApp(): Application {
    return createMockApp({
      mountPath: "/api/private",
      router: createEligibilityRouter({
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
      .post("/api/private/save")
      .send({ eligibility_assessment: {} });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when resource_id is not a valid UUID", async () => {
    const response = await request(buildApp())
      .post("/api/private/save")
      .send({ eligibility_assessment: {}, resource_id: "not-a-uuid" });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when eligibility_assessment is missing", async () => {
    const response = await request(buildApp())
      .post("/api/private/save")
      .send({ resource_id: resourceId });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when eligibility_assessment is a string", async () => {
    const response = await request(buildApp())
      .post("/api/private/save")
      .send({ eligibility_assessment: "not-an-object", resource_id: resourceId });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when eligibility_assessment is an array", async () => {
    const response = await request(buildApp())
      .post("/api/private/save")
      .send({ eligibility_assessment: [], resource_id: resourceId });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 when eligibility_assessment is null", async () => {
    const response = await request(buildApp())
      .post("/api/private/save")
      .send({ eligibility_assessment: null, resource_id: resourceId });

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 for an empty request body", async () => {
    const response = await request(buildApp())
      .post("/api/private/save")
      .send({});

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 400 for a malformed JSON body", async () => {
    const response = await request(buildApp())
      .post("/api/private/save")
      .set("Content-Type", "application/json")
      .send("{not valid json");

    expect(response.status).to.equal(BAD_REQUEST);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("returns 200 and forwards the split payload to the RCW API on success", async () => {
    updateApplicationMeansStub.resolves({ data: undefined, status: 204 });

    const response = await request(buildApp())
      .post("/api/private/save")
      .send({
        eligibility_assessment: {
          api_response: { indication: true },
          level_of_help: "controlled_legal_representation",
        },
        resource_id: resourceId,
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
      .post("/api/private/save")
      .send({ eligibility_assessment: {}, resource_id: resourceId });

    expect(response.status).to.equal(UNAUTHORIZED);
    expect(updateApplicationMeansStub.called).to.equal(false);
  });

  it("surfaces a 5xx when the RCW API call fails", async () => {
    updateApplicationMeansStub.resolves({ data: {}, status: 500 });
    sinon.stub(logger, "error");

    const response = await request(buildApp())
      .post("/api/private/save")
      .send({ eligibility_assessment: {}, resource_id: resourceId });

    expect(response.status).to.equal(INTERNAL_SERVER_ERROR);
  });
});
