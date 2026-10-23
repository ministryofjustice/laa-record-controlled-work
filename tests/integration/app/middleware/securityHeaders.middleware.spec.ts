import type { Application } from "express";

import { expect } from "chai";
import { before, describe, it } from "mocha";
import request from "supertest";

import createApp from "#/app.js";
import { FOUND, NOT_FOUND, OK } from "#/lib/constants/http.js";

describe("security headers", () => {
  let app: Application;

  before(async () => {
    app = await createApp();
  });

  it("protects static, dynamic, redirect and error responses", async () => {
    const [asset, dynamic, redirect, notFound] = await Promise.all([
      request(app).get("/views/icons/laa-logo.svg"),
      request(app).get("/status"),
      request(app).get("/cases/example-id"),
      request(app).post("/auth/signout"),
    ]);

    expect(asset.status).to.equal(OK);
    expect(dynamic.status).to.equal(OK);
    expect(redirect.status).to.equal(FOUND);
    expect(redirect.headers.location).to.equal("/auth/signin");
    expect(notFound.status).to.equal(NOT_FOUND);

    for (const { headers } of [asset, dynamic, redirect, notFound]) {
      expect(headers["strict-transport-security"]).to.equal(
        "max-age=31536000; includeSubDomains",
      );
      expect(headers["content-security-policy"]).to.include(
        "frame-ancestors 'self'",
      );
      expect(headers["content-security-policy"]).to.include("frame-src 'none'");
      expect(headers["content-security-policy"]).to.match(
        /script-src 'self' 'nonce-[^']+'/,
      );
      expect(headers["x-content-type-options"]).to.equal("nosniff");
      expect(headers["referrer-policy"]).to.equal("no-referrer");
      expect(headers["x-frame-options"]).to.equal("SAMEORIGIN");
    }

    expect(asset.headers["content-type"]).to.match(/^image\/svg\+xml/);
    expect(asset.headers["cache-control"]).to.equal("public, max-age=0");
  });
});
