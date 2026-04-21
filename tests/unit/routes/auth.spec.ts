import { AuthService } from "#src/services/auth.js";
import authRouter from "#src/routes/auth.js";
import { setupCsrf } from "#middleware/setupCsrf.js";
import { failure, success } from "#src/lib/result.js";
import { expect } from "chai";
import express from "express";
import session from "express-session";
import sinon from "sinon";
import request from "supertest";
import {
  HTTP_BAD_REQUEST,
  HTTP_FOUND,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_UNAUTHORIZED,
} from "#src/constants/httpStatus.js";

describe("authRoutes", () => {
  let authServiceStub: {
    getAuthCodeUrl: sinon.SinonStub;
    processAuthCodeCallback: sinon.SinonStub;
  };
  let getLogoutUrlStub: sinon.SinonStub;
  let app = createApp();
  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth";
  const SUCCESS_REDIRECT = "/case/123";
  const LOGOUT_URL =
    "https://login.microsoftonline.com/tenant/oauth2/v2.0/logout?post_logout_redirect_uri=https://app/signed-out";

  beforeEach(() => {
    authServiceStub = {
      getAuthCodeUrl: sinon.stub().resolves(success(AUTH_CODE_URL)),
      processAuthCodeCallback: sinon
        .stub()
        .resolves(success({ successRedirect: SUCCESS_REDIRECT })),
    };
    sinon
      .stub(AuthService, "create")
      .returns(authServiceStub as unknown as AuthService);
    getLogoutUrlStub = sinon
      .stub(AuthService, "getLogoutUrl")
      .returns(LOGOUT_URL);
  });

  afterEach(() => sinon.restore());

  describe("POST /auth/code/callback", () => {
    it("calls processAuthCodeCallback() and redirects to successRedirect", async () => {
      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(authServiceStub.processAuthCodeCallback.calledOnce).to.be.true;
      expect(res.status).to.equal(HTTP_FOUND);
      expect(res.headers.location).to.equal(SUCCESS_REDIRECT);
    });

    it("responds with 400 when body.code is missing", async () => {
      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ state: "encoded-state" });

      expect(authServiceStub.processAuthCodeCallback.called).to.be.false;
      expect(res.status).to.equal(HTTP_BAD_REQUEST);
    });

    it("responds with 400 when processAuthCodeCallback returns MissingAuthCodeRequest", async () => {
      authServiceStub.processAuthCodeCallback.resolves(
        failure({ type: "MissingAuthCodeRequest" }),
      );

      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(res.status).to.equal(HTTP_BAD_REQUEST);
    });

    it("responds with 400 when processAuthCodeCallback returns StateMismatch", async () => {
      authServiceStub.processAuthCodeCallback.resolves(
        failure({ type: "StateMismatch" }),
      );

      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(res.status).to.equal(HTTP_BAD_REQUEST);
    });

    it("responds with 401 when processAuthCodeCallback returns TokenAcquisitionFailed", async () => {
      authServiceStub.processAuthCodeCallback.resolves(
        failure({ type: "TokenAcquisitionFailed", cause: new Error("MSAL") }),
      );

      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(res.status).to.equal(HTTP_UNAUTHORIZED);
    });
  });

  describe("POST /auth/signout", () => {
    it("redirects to the URL returned by authService.getLogoutUrl()", async () => {
      const agent = request.agent(app);
      const tokenRes = await agent.get("/csrf-token");
      const csrfToken = tokenRes.body.csrfToken as string;

      const res = await agent
        .post("/auth/signout")
        .type("form")
        .send({ _csrf: csrfToken });

      expect(getLogoutUrlStub.calledOnce).to.be.true;
      expect(res.status).to.equal(HTTP_FOUND);
      expect(res.headers.location).to.equal(LOGOUT_URL);
    });

    it("destroys the session and clears the cookie before redirecting", async () => {
      const agent = request.agent(app);
      await agent.get("/auth/signin"); // establishes a session cookie
      const tokenRes = await agent.get("/csrf-token");
      const csrfToken = tokenRes.body.csrfToken as string;

      const res = await agent
        .post("/auth/signout")
        .type("form")
        .send({ _csrf: csrfToken });

      expect(res.status).to.equal(HTTP_FOUND);
      const rawCookies = res.headers["set-cookie"];
      const cookies: string[] = Array.isArray(rawCookies)
        ? rawCookies
        : [rawCookies].filter(Boolean);
      expect(
        cookies.some((cookie) => cookie.includes("Expires=Thu, 01 Jan 1970")),
      ).to.be.true;
    });
  });

  describe("GET /auth/signin", () => {
    it("redirects to the URL returned by authService.getAuthCodeUrl()", async () => {
      const response = await request(app).get("/auth/signin");
      expect(response.status).to.equal(HTTP_FOUND);
      expect(response.headers.location).to.equal(AUTH_CODE_URL);
    });

    it("responds with 500 when getAuthCodeUrl returns a MsalError", async () => {
      authServiceStub.getAuthCodeUrl.resolves(
        failure({ type: "MsalError", cause: new Error("MSAL failure") }),
      );

      const response = await request(app).get("/auth/signin");
      expect(response.status).to.equal(HTTP_INTERNAL_SERVER_ERROR);
    });
  });
});

function createApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
  setupCsrf(app);
  // Exposes a CSRF token so tests can make valid POST requests
  app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken?.() });
  });
  app.use("/auth", authRouter);
  // Catches errors passed to next() so tests can assert on status/message
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(HTTP_INTERNAL_SERVER_ERROR).json({ message: err.message });
    },
  );
  return app;
}
