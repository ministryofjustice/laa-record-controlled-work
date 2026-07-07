import express, { type Application } from "express";
import request from "supertest";
import session from "express-session";
import sinon from "sinon";
import { expect } from "chai";

import { EntraService } from "#/auth/entra.service.js";
import { refreshToken } from "#/middleware/refreshToken.js";
import { failure, success } from "#/lib/either.js";
import { TokenRefreshError } from "#/auth/auth.errors.js";
import { FOUND, OK } from "#/lib/constants/http.js";

const VALID_TOKEN_EXPIRY = Date.now() + 60 * 60 * 1000; // 1 hour from now
const NEAR_EXPIRY_TOKEN = Date.now() + 2 * 60 * 1000; // 2 minutes from now (within grace period)
const EXPIRED_TOKEN = Date.now() - 1000;

const REFRESHED_TOKEN_RESULT = {
  accessToken: "refreshed-token",
  account: { username: "user" },
  idToken: "id-token",
  tokenCache: '{"refreshed":true}',
  tokenExpiry: Date.now() + 3600 * 1000,
};

function createTestApp(sessionOverrides: Record<string, unknown> = {}): Application {
  const app = express();
  app.use(session({ resave: false, saveUninitialized: true, secret: "test" }));

  app.use((req, _res, next) => {
    Object.assign(req.session, sessionOverrides);
    next();
  });

  app.use(refreshToken);

  app.get("/protected", (_req, res) => {
    res.status(OK).send("ok");
  });

  return app;
}

describe("refreshToken middleware", () => {
  let entraStub: { getAccessToken: sinon.SinonStub };

  beforeEach(() => {
    entraStub = {
      getAccessToken: sinon.stub().resolves(success(REFRESHED_TOKEN_RESULT)),
    };
    sinon.stub(EntraService, "create").returns(entraStub as unknown as EntraService);
  });

  afterEach(() => sinon.restore());

  it("calls next() when session is not authenticated", async () => {
    const app = createTestApp({ isAuthenticated: false });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(OK);
    expect(entraStub.getAccessToken.called).to.be.false;
  });

  it("calls next() when token is valid and not near expiry", async () => {
    const app = createTestApp({
      isAuthenticated: true,
      account: { username: "user" },
      accessToken: "current-token",
      tokenCache: "{}",
      tokenExpiry: VALID_TOKEN_EXPIRY,
    });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(OK);
    expect(entraStub.getAccessToken.called).to.be.false;
  });

  it("silently refreshes the token when expiry is within the grace period", async () => {
    const app = createTestApp({
      isAuthenticated: true,
      account: { username: "user" },
      accessToken: "old-token",
      tokenCache: "{}",
      tokenExpiry: NEAR_EXPIRY_TOKEN,
    });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(OK);
    expect(entraStub.getAccessToken.calledOnce).to.be.true;
  });

  it("silently refreshes the token when no tokenExpiry is set", async () => {
    const app = createTestApp({
      isAuthenticated: true,
      account: { username: "user" },
      tokenCache: "{}",
    });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(OK);
    expect(entraStub.getAccessToken.calledOnce).to.be.true;
  });

  it("redirects to /auth/signin when token is near expiry and refresh fails", async () => {
    entraStub.getAccessToken.resolves(failure(new TokenRefreshError()));
    sinon.stub(console, "warn");

    const app = createTestApp({
      isAuthenticated: true,
      account: { username: "user" },
      tokenCache: "{}",
      tokenExpiry: NEAR_EXPIRY_TOKEN,
    });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(FOUND);
    expect(res.headers.location).to.equal("/auth/signin");
  });

  it("redirects to /auth/signin when token is near expiry and no tokenCache is set", async () => {
    sinon.stub(console, "warn");

    const app = createTestApp({
      isAuthenticated: true,
      account: { username: "user" },
      tokenExpiry: NEAR_EXPIRY_TOKEN,
    });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(FOUND);
    expect(res.headers.location).to.equal("/auth/signin");
    expect(entraStub.getAccessToken.called).to.be.false;
  });
});

