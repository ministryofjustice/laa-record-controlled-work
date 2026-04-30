import { setupCsrf } from "#/middleware/setupCsrf.js";
import express from "express";
import request from "supertest";
import session from "express-session";
import authRouter from "#/routes/auth.js";
import {
  BAD_REQUEST,
  FOUND,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#/lib/constants/httpStatus.js";
import sinon from "sinon";
import { AuthService } from "#/services/auth.js";
import { failure, success } from "#/lib/either.js";
import { expect } from "chai";
import { TokenAcquisitionError } from "#/lib/errors/auth.js";

const AUTH_CODE_URL = "https://login.microsoftonline.com/auth";
const SUCCESS_REDIRECT = "/case/123";
const LOGOUT_URL =
  "https://login.microsoftonline.com/tenant/oauth2/v2.0/logout?post_logout_redirect_uri=https://app/signed-out";

describe("Auth Controller", () => {
  let getLogoutUrlStub: sinon.SinonStub;
  let authServiceStub: {
    getAuthCodeUrl: sinon.SinonStub;
    processAuthCodeCallback: sinon.SinonStub;
  };
  let mockApp: express.Application;

  before(() => {
    mockApp = createMockApp();

  });

  beforeEach(() => {
    // adding console.error stub to hide purposely thrown errors from terminal
    sinon.stub(console, "error");

    authServiceStub = {
      getAuthCodeUrl: sinon.stub().resolves(success(AUTH_CODE_URL)),
      processAuthCodeCallback: sinon.stub().resolves(success(SUCCESS_REDIRECT)),
    };

    sinon
      .stub(AuthService, "create")
      .returns(authServiceStub as unknown as AuthService);

    getLogoutUrlStub = sinon
      .stub(AuthService, "getLogoutUrl")
      .returns(LOGOUT_URL);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("signin()", () => {
    it("redirects to the URL returned by authService.getAuthCodeUrl()", async () => {
      const res = await request(mockApp).get("/auth/signin");

      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal(AUTH_CODE_URL);
    });

    it("calls next(error) when getAuthCodeUrl() throws", async () => {
      const errorMessage = "MSAL failure";
      const error = new Error(errorMessage);
      authServiceStub.getAuthCodeUrl.resolves(failure(error));

      const res = await request(mockApp).get("/auth/signin");

      expect(res.status).to.equal(INTERNAL_SERVER_ERROR);
      expect(res.text).to.equal(errorMessage);
    });
  });

  describe("processAuthCodeCallback()", () => {
    const REQUEST_BODY = { code: "auth-code-abc", state: "encoded-state" };

    it("redirects to successRedirect on success", async () => {
      const res = await request(mockApp)
        .post("/auth/code/callback")
        .type("form")
        .send(REQUEST_BODY);

      expect(authServiceStub.processAuthCodeCallback.calledOnce).to.be.true;
      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal(SUCCESS_REDIRECT);
    });

    it("responds with 400 when auth request body doesn't match schema", async () => {
      const wrongRequestBody = { missing: "property" };

      const res = await request(mockApp)
        .post("/auth/code/callback")
        .type("form")
        .send(wrongRequestBody);

      expect(authServiceStub.processAuthCodeCallback.called).to.be.false;
      expect(res.status).to.equal(BAD_REQUEST);
      expect(res.text).to.equal("Invalid redirect payload");
    });

    it("responds with 401 unathorised when TokenAcquisitionError is thrown", async () => {
      const error = new TokenAcquisitionError();
      authServiceStub.processAuthCodeCallback.resolves(failure(error));

      const res = await request(mockApp)
        .post("/auth/code/callback")
        .type("form")
        .send(REQUEST_BODY);

      expect(res.status).to.equal(UNAUTHORIZED);
      expect(res.text).to.equal("Token acquisition failed");
    });

    it("responds with 400 when other errors are thrown", async () => {
      const errorMessage = "Random Error";
      const error = new Error(errorMessage);
      authServiceStub.processAuthCodeCallback.resolves(failure(error));

      const res = await request(mockApp)
        .post("/auth/code/callback")
        .type("form")
        .send(REQUEST_BODY);

      expect(res.status).to.equal(BAD_REQUEST);
      expect(res.text).to.equal(errorMessage);
    });
  });

  describe("signOut()", () => {
    it("redirects to the URL returned by authService.getLogoutUrl()", async () => {
      const agent = request.agent(mockApp);
      const tokenRes = await agent.get("/csrf-token");
      const csrfToken = tokenRes.body.csrfToken as string;

      const res = await agent
        .post("/auth/signout")
        .type("form")
        .send({ _csrf: csrfToken });

      expect(getLogoutUrlStub.calledOnce).to.be.true;
      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal(LOGOUT_URL);
    });

    it("destroys the session and clears the cookie before redirecting", async () => {
      const agent = request.agent(mockApp);
      await agent.get("/auth/signin"); // establishes a session cookie
      const tokenRes = await agent.get("/csrf-token");
      const csrfToken = tokenRes.body.csrfToken as string;

      const res = await agent
        .post("/auth/signout")
        .type("form")
        .send({ _csrf: csrfToken });

      expect(res.status).to.equal(FOUND);
      const rawCookies = res.headers["set-cookie"];
      const cookies: string[] = Array.isArray(rawCookies)
        ? rawCookies
        : [rawCookies].filter(Boolean);
      expect(
        cookies.some((cookie) => cookie.includes("Expires=Thu, 01 Jan 1970")),
      ).to.be.true;
    });
  });
});

/**
 * Creates a mock app for test auth routes against
 * @returns a sandbox express app
 */
function createMockApp(): express.Application {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
  setupCsrf(app);
  // Exposes a CSRF token so tests can make valid POST requests
  app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken?.() });
  });
  app.use("/auth", authRouter);
  // // Catches errors passed to next() so tests can assert on status/message
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(INTERNAL_SERVER_ERROR).json({ message: err.message });
    },
  );
  return app;
}
