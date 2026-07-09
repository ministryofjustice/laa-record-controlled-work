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
  let entraStub: { acquireTokenSilent: sinon.SinonStub };

  beforeEach(() => {
    entraStub = {
      acquireTokenSilent: sinon.stub().resolves(success(REFRESHED_TOKEN_RESULT)),
    };
    sinon.stub(EntraService, "create").returns(entraStub as unknown as EntraService);
  });

  afterEach(() => sinon.restore());

  it("calls next() when session is not authenticated", async () => {
    const app = createTestApp({ isAuthenticated: false });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(OK);
    expect(entraStub.acquireTokenSilent.called).to.be.false;
  });

  it("silently refreshes the token on every authenticated request", async () => {
    const app = createTestApp({
      isAuthenticated: true,
      account: { username: "user" },
    });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(OK);
    expect(entraStub.acquireTokenSilent.calledOnce).to.be.true;
  });

  it("updates session with refreshed token data", async () => {
    const testAccount = { username: "updated-user" };
    const testIdToken = "new-id-token";
    entraStub.acquireTokenSilent.resolves(
      success({
        account: testAccount,
        idToken: testIdToken,
        tokenExpiry: Date.now() + 3600 * 1000,
      } as any),
    );

    const app = createTestApp({
      isAuthenticated: true,
      account: { username: "old-user" },
      idToken: "old-id-token",
    });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(OK);
  });

  it("redirects to /auth/signin when token acquisition fails", async () => {
    entraStub.acquireTokenSilent.resolves(failure(new TokenRefreshError()));

    const app = createTestApp({
      isAuthenticated: true,
      account: { username: "user" },
    });
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(FOUND);
    expect(res.headers.location).to.equal("/auth/signin");
  });
});

