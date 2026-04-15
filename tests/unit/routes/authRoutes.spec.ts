import { AuthService } from "#src/services/authService.js";
import authRouter from "#src/routes/authRoutes.js";
import { expect } from "chai";
import express from "express";
import session from "express-session";
import sinon from "sinon";
import request from "supertest";

describe("authRoutes", () => {
  let authServiceStub: {
    getAuthCodeUrl: sinon.SinonStub;
    handleRedirect: sinon.SinonStub;
    getLogoutUrl: sinon.SinonStub;
  };
  let app = createApp();
  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth";
  const SUCCESS_REDIRECT = "/case/123";
  const LOGOUT_URL =
    "https://login.microsoftonline.com/tenant/oauth2/v2.0/logout?post_logout_redirect_uri=https://app/signed-out";

  beforeEach(() => {
    authServiceStub = {
      getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL),
      handleRedirect: sinon
        .stub()
        .resolves({ successRedirect: SUCCESS_REDIRECT }),
      getLogoutUrl: sinon.stub().returns(LOGOUT_URL),
    };
    sinon
      .stub(AuthService, "create")
      .returns(authServiceStub as unknown as AuthService);
  });

  afterEach(() => sinon.restore());

  describe("POST /auth/redirect", () => {
    it("calls handleRedirect() and redirects to successRedirect", async () => {
      const res = await request(app)
        .post("/auth/redirect")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(authServiceStub.handleRedirect.calledOnce).to.be.true;
      expect(res.status).to.equal(302);
      expect(res.headers.location).to.equal(SUCCESS_REDIRECT);
    });

    it("responds with 400 when body.code is missing", async () => {
      const res = await request(app)
        .post("/auth/redirect")
        .type("form")
        .send({ state: "encoded-state" });

      expect(authServiceStub.handleRedirect.called).to.be.false;
      expect(res.status).to.equal(400);
    });

    it("calls next(error) when handleRedirect() throws", async () => {
      const error = new Error("MSAL failure");
      authServiceStub.handleRedirect.rejects(error);

      const app = createApp();

      const res = await request(app)
        .post("/auth/redirect")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal("MSAL failure");
    });
  });

  describe("GET /auth/signout", () => {
    it("redirects to the URL returned by authService.getLogoutUrl()", async () => {
      const res = await request(app).get("/auth/signout");

      expect(authServiceStub.getLogoutUrl.calledOnce).to.be.true;
      expect(res.status).to.equal(302);
      expect(res.headers.location).to.equal(LOGOUT_URL);
    });

    it("destroys the session before redirecting", async () => {
      const agent = request.agent(app);
      await agent.get("/auth/signin"); // establishes a session cookie
      const res = await agent.get("/auth/signout");

      expect(res.status).to.equal(302);
      const cookie = res.headers["set-cookie"] as string | undefined;
      expect(cookie).to.be.undefined;
    });
  });

  describe("GET /auth/signin", () => {
    it("redirects to the URL returned by authService.getAuthCodeUrl()", async () => {
      const response = await request(app).get("/auth/signin");
      expect(response.status).to.equal(302);
      expect(response.headers.location).to.equal(AUTH_CODE_URL);
    });

    it("calls next(error) when getAuthCodeUrl() throws", async () => {
      const errorMessage = "MSAL failure";
      const error = new Error(errorMessage);
      authServiceStub.getAuthCodeUrl.rejects(error);

      const app = createApp();

      const response = await request(app).get("/auth/signin");
      expect(response.status).to.equal(500);
      expect(response.body.message).to.equal(errorMessage);
    });
  });
});

function createApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  app.use("/auth", authRouter);
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(500).json({ message: err.message });
    },
  );
  return app;
}
