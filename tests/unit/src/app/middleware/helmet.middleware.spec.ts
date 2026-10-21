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

  it("allows the Sentry origin and Replay workers when Sentry is enabled", async () => {
    process.env.SENTRY_ENABLED = "true";
    process.env.SENTRY_DSN = "https://example@sentry.io/123";

    const app = express();
    app.use(helmet());
    app.get("/", (req, res) => res.send("ok"));

    const response = await request(app).get("/");
    const policy = response.headers["content-security-policy"];

    expect(policy).to.include("connect-src 'self' https://sentry.io");
    expect(policy).to.include("worker-src 'self' blob:");
    expect(policy).to.not.include("example@");
  });

  it("does not allow Sentry connections or blob workers when disabled", async () => {
    process.env.SENTRY_ENABLED = "false";
    process.env.SENTRY_DSN = "https://example@sentry.io/123";

    const app = express();
    app.use(helmet());
    app.get("/", (req, res) => res.send("ok"));

    const response = await request(app).get("/");
    const policy = response.headers["content-security-policy"];

    expect(policy).to.include("connect-src 'self';");
    expect(policy).to.match(/worker-src 'self'(;|$)/);
    expect(policy).to.not.include("https://sentry.io");
  });
});
