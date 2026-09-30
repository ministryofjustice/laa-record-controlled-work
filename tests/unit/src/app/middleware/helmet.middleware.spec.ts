import express from "express";
import request from "supertest";

import { expect } from "chai";

import { helmet } from "#/app/middleware/helmet.middleware.js";

describe("helmet middleware", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("does not include report-uri when SENTRY_CSP_REPORT_ENDPOINT is unset", async () => {
    delete process.env.SENTRY_CSP_REPORT_ENDPOINT;

    const app = express();
    app.use(helmet());
    app.get("/", (req, res) => res.send("ok"));

    const response = await request(app).get("/");

    expect(response.headers["content-security-policy"]).to.not.include(
      "report-uri",
    );
  });

  it("includes report-uri when SENTRY_CSP_REPORT_ENDPOINT is set", async () => {
    process.env.SENTRY_CSP_REPORT_ENDPOINT = "https://sentry.example/security";

    const app = express();
    app.use(helmet());
    app.get("/", (req, res) => res.send("ok"));

    const response = await request(app).get("/");

    expect(response.headers["content-security-policy"]).to.include(
      "report-uri https://sentry.example/security",
    );
  });
});
