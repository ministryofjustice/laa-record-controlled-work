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

  it("marks sensitive pages, exports, eligibility data, redirects and errors no-store", async () => {
    const agent = request.agent(app);
    await agent.get("/test/select-office");

    const responses = [
      ["HTML", await agent.get("/sensitive/html")],
      ["export", await agent.get(`/cases/${APPLICATION_ID}/export`)],
      [
        "eligibility JSON",
        await agent.get(`/api/applications/${APPLICATION_ID}/eligibility`),
      ],
      ["redirect", await agent.get("/sensitive/redirect")],
      ["unauthorized error", await agent.get("/sensitive/unauthorized")],
      ["not-found error", await agent.get("/sensitive/not-found")],
      ["server error", await agent.get("/sensitive/server-error")],
    ] as const;

    expect(responses[0][1].status).to.equal(200);
    expect(responses[1][1].status).to.equal(200);
    expect(responses[2][1].status).to.equal(200);
    expect(responses[3][1].status).to.equal(302);
    expect(responses[4][1].status).to.equal(302);
    expect(responses[5][1].status).to.equal(404);
    expect(responses[6][1].status).to.equal(500);

    for (const [responseType, response] of responses) {
      expect(
        response.headers["cache-control"],
        `${responseType} response`,
      ).to.equal(CACHE_CONTROL);
    }
  });

  it("preserves the public static asset cache policy", async () => {
    const response = await request(app).get("/public-asset.txt");

    expect(response.status).to.equal(200);
    expect(response.text).to.equal("public asset\n");
    expect(response.headers["cache-control"]).to.equal("public, max-age=0");
  });
});
