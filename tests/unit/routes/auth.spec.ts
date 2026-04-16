import { AuthService } from "#src/services/auth.js";
import authRouter from "#src/routes/auth.js";
import { expect } from "chai";
import express from "express";
import session from "express-session";
import sinon from "sinon";
import request from "supertest";
import config from "#config.js";

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
      getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL),
      processAuthCodeCallback: sinon
        .stub()
        .resolves({ successRedirect: SUCCESS_REDIRECT }),
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
      expect(res.status).to.equal(config.HTTP_STATUS.UNAUTHORIZED);
      expect(res.headers.location).to.equal(SUCCESS_REDIRECT);
    });

    it("responds with 400 when body.code is missing", async () => {
      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ state: "encoded-state" });

      expect(authServiceStub.processAuthCodeCallback.called).to.be.false;
      expect(res.status).to.equal(config.HTTP_STATUS.BAD_REQUEST);
    });

    it("calls next(error) when processAuthCodeCallback() throws", async () => {
      const error = new Error("MSAL failure");
      authServiceStub.processAuthCodeCallback.rejects(error);

      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(res.status).to.equal(config.HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(res.body.message).to.equal("MSAL failure");
    });
  });

  describe("GET /auth/signout", () => {
    it("redirects to the URL returned by authService.getLogoutUrl()", async () => {
      const res = await request(app).get("/auth/signout");

      expect(getLogoutUrlStub.calledOnce).to.be.true;
      expect(res.status).to.equal(config.HTTP_STATUS.FOUND);
      expect(res.headers.location).to.equal(LOGOUT_URL);
    });

    it("destroys the session and clears the cookie before redirecting", async () => {
      const agent = request.agent(app);
      await agent.get("/auth/signin"); // establishes a session cookie
      const res = await agent.get("/auth/signout");

      expect(res.status).to.equal(config.HTTP_STATUS.FOUND);
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
      expect(response.status).to.equal(config.HTTP_STATUS.FOUND);
      expect(response.headers.location).to.equal(AUTH_CODE_URL);
    });

    it("calls next(error) when getAuthCodeUrl() throws", async () => {
      const errorMessage = "MSAL failure";
      const error = new Error(errorMessage);
      authServiceStub.getAuthCodeUrl.rejects(error);

      const response = await request(app).get("/auth/signin");
      expect(response.status).to.equal(
        config.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(response.body.message).to.equal(errorMessage);
    });
  });
});

function createApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
  app.use("/auth", authRouter);
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res
        .status(config.HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    },
  );
  return app;
}
