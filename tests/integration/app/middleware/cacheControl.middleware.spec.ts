import type { Express } from "express";

import express from "express";
import path from "node:path";
import request from "supertest";

import { expect } from "chai";
import sinon from "sinon";

import { ApplicationError } from "#/app/errors/ApplicationError.js";
import { NotFoundError } from "#/app/errors/NotFoundError.js";
import { UnauthorizedError } from "#/app/errors/UnauthorizedError.js";
import { handleGlobalErrors } from "#/app/middleware/handleGlobalErrors.middleware.js";
import { initMiddleware } from "#/app/middleware.js";
import { createEligibilityRouter } from "#/api/eligibility/eligibility.routes.js";
import config from "#/config.js";
import { createExportRouter } from "#/export/export.routes.js";
import { logger } from "#/logger.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const APPLICATION_ID = "123e4567-e89b-12d3-a456-426614174000";
const CACHE_CONTROL = "private, no-store";

describe("sensitive response caching", () => {
  let app: Express;

  beforeEach(async () => {
    sinon
      .stub(config.app.paths, "static")
      .value(path.resolve("tests/integration/fixtures/cache-control"));
    sinon.stub(config.api, "useMockAccessToken").value(true);
    sinon.stub(logger, "error");

    app = express();
    await initMiddleware(app, {});

    app.engine("njk", (_filePath, _options, callback) => {
      callback(null, "rendered response");
    });
    app.set("views", path.resolve("src/views"));
    app.set("view engine", "njk");

    app.get("/test/select-office", (req, res) => {
      req.session.selectedOffice = {
        address: "Office address",
        code: "OFFICE-A",
      };
      res.end();
    });
    app.get("/sensitive/html", (_req, res) => {
      res.send("<main>Sensitive content</main>");
    });
    app.get("/sensitive/redirect", (_req, res) => {
      res.redirect("/auth/signin");
    });
    app.get("/sensitive/unauthorized", () => {
      throw new UnauthorizedError();
    });
    app.get("/sensitive/not-found", () => {
      throw new NotFoundError();
    });
    app.get("/sensitive/server-error", () => {
      throw new ApplicationError("Server error");
    });

    app.use(
      "/cases/:applicationId/export",
      createExportRouter({
        getApplication: sinon.stub().resolves({
          data: getGetApplicationResponseMock({
            id: APPLICATION_ID,
            providerOfficeCode: "OFFICE-A",
          }),
          status: 200,
        }),
      }),
    );
    app.use(
      "/api/applications/:applicationId/eligibility",
      createEligibilityRouter({
        getApplication: sinon.stub().resolves({
          data: getGetApplicationResponseMock({
            id: APPLICATION_ID,
            clientDetails: {
              ...getGetApplicationResponseMock().clientDetails,
              dateOfBirth: "1990-01-01",
            },
            eligibility: null,
          }),
          status: 200,
        }),
        updateApplicationMeans: sinon.stub(),
      }),
    );

    app.use(handleGlobalErrors());
  });

  afterEach(() => {
    sinon.restore();
  });

  const sensitiveResponses = [
    ["sensitive HTML", "/sensitive/html", 200],
    ["export", `/cases/${APPLICATION_ID}/export`, 200],
    [
      "eligibility JSON",
      `/api/applications/${APPLICATION_ID}/eligibility`,
      200,
    ],
    ["redirect", "/sensitive/redirect", 302],
    ["unauthorized error", "/sensitive/unauthorized", 302],
    ["not-found error", "/sensitive/not-found", 404],
    ["server error", "/sensitive/server-error", 500],
  ] as const;

  sensitiveResponses.forEach(([name, responsePath, expectedStatus]) => {
    it(`marks ${name} response private and no-store`, async () => {
      const agent = request.agent(app);
      await agent.get("/test/select-office");

      const response = await agent.get(responsePath);

      expect(response.status).to.equal(expectedStatus);
      expect(response.headers["cache-control"], `${name} response`).to.equal(
        CACHE_CONTROL,
      );
    });
  });

  it("preserves the public static asset cache policy", async () => {
    const response = await request(app).get("/public-asset.txt");

    expect(response.status).to.equal(200);
    expect(response.text).to.equal("public asset\n");
    expect(response.headers["cache-control"]).to.equal("public, max-age=0");
  });
});
