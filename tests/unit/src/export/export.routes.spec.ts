import type { Application } from "express";

import express from "express";
import request from "supertest";

import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import config from "#/config.js";
import { requireAuth } from "#/auth/middleware/requireAuth.middleware.js";
import { createExportRouter } from "#/export/export.routes.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

import { createMockApp } from "../../utils.js";

const MOUNT_PATH = "/cases/:applicationId/export";
const applicationId = "123e4567-e89b-12d3-a456-426614174000";

function exportPath(id: string): string {
  return `/cases/${id}/export`;
}

describe("GET /cases/:applicationId/export", () => {
  let getApplicationStub: sinon.SinonStub;

  function buildApp(): Application {
    const app = createMockApp({
      mountPath: MOUNT_PATH,
      router: createExportRouter({ getApplication: getApplicationStub }),
      useCsrf: false,
    });
    app.engine("njk", (_path, options, callback) => {
      const locals = options as {
        applicationRefNumber?: string | null;
        clientName?: string | null;
        individualLegalAidNumber?: string;
      };
      callback(
        null,
        JSON.stringify({
          applicationRefNumber: locals.applicationRefNumber,
          clientName: locals.clientName,
          individualLegalAidNumber: locals.individualLegalAidNumber,
        }),
      );
    });
    app.set("views", "src/views");
    app.set("view engine", "njk");
    app.get("/test/select-office", (req, res) => {
      req.session.selectedOffice = {
        address: "Office address",
        code: "OFFICE-A",
      };
      res.end();
    });
    return app;
  }

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    getApplicationStub = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns 400 for an invalid application ID without calling the API", async () => {
    const response = await request(buildApp()).get(exportPath("not-a-uuid"));

    expect(response.status).to.equal(400);
    expect(response.headers["cache-control"]).to.equal(
      "no-cache, no-store, must-revalidate",
    );
    expect(getApplicationStub.called).to.equal(false);
  });

  it("redirects anonymous requests to sign in before loading the application", async () => {
    const protectedRouter = express.Router({ mergeParams: true });
    protectedRouter.use(requireAuth());
    protectedRouter.use(
      createExportRouter({ getApplication: getApplicationStub }),
    );

    const app = createMockApp({
      mountPath: MOUNT_PATH,
      router: protectedRouter,
      useCsrf: false,
    });

    const response = await request(app).get(exportPath(applicationId));

    expect(response.status).to.equal(302);
    expect(response.headers.location).to.equal("/auth/signin");
    expect(getApplicationStub.called).to.equal(false);
  });

  it("renders the export and sets no-cache headers", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({
        id: applicationId,
        providerOfficeCode: "OFFICE-A",
        applicationRefNumber: "CW-123456",
        clientDetails: {
          ...getGetApplicationResponseMock().clientDetails,
          firstName: "Jane",
          lastName: "Doe",
        },
      }),
      status: 200,
    });

    const agent = request.agent(buildApp());
    await agent.get("/test/select-office");
    const response = await agent.get(exportPath(applicationId));

    expect(response.status).to.equal(200);
    expect(response.headers["cache-control"]).to.equal(
      "no-cache, no-store, must-revalidate",
    );
    expect(response.headers.pragma).to.equal("no-cache");
    expect(response.headers.expires).to.equal("0");
    expect(JSON.parse(response.text)).to.deep.equal({
      applicationRefNumber: "CW-123456",
      clientName: "Jane Doe",
    });
  });

  it("returns 401 when session credentials cannot be used", async () => {
    sinon.stub(config.api, "useMockAccessToken").value(false);

    const response = await request(buildApp()).get(exportPath(applicationId));

    expect(response.status).to.equal(401);
    expect(response.headers["cache-control"]).to.equal(
      "no-cache, no-store, must-revalidate",
    );
    expect(getApplicationStub.called).to.equal(false);
  });

  for (const status of [403, 404]) {
    it(`returns 404 with no-cache headers for downstream ${status}`, async () => {
      getApplicationStub.resolves({ data: {}, status });

      const response = await request(buildApp()).get(exportPath(applicationId));

      expect(response.status).to.equal(404);
      expect(response.headers["cache-control"]).to.equal(
        "no-cache, no-store, must-revalidate",
      );
      expect(response.headers.pragma).to.equal("no-cache");
      expect(response.headers.expires).to.equal("0");
    });
  }

  it("returns 500 with no-cache headers for an unexpected downstream status", async () => {
    getApplicationStub.resolves({ data: {}, status: 500 });

    const response = await request(buildApp()).get(exportPath(applicationId));

    expect(response.status).to.equal(500);
    expect(response.headers["cache-control"]).to.equal(
      "no-cache, no-store, must-revalidate",
    );
    expect(response.headers.pragma).to.equal("no-cache");
    expect(response.headers.expires).to.equal("0");
  });
});
