import { AuthService } from "#src/services/authService.js";
import authRouter from "#src/routes/authRoutes.js";
import { expect } from "chai";
import express from "express";
import session from "express-session";
import sinon from "sinon";
import request from "supertest";

describe("authRoutes", () => {
  let authServiceStub: { getAuthCodeUrl: sinon.SinonStub };
  let app = createApp();
  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth";

  beforeEach(() => {
    authServiceStub = { getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL) };
    sinon
      .stub(AuthService, "create")
      .returns(authServiceStub as unknown as AuthService);
  });

  afterEach(() => sinon.restore());

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

      const appWithErrorHandler = createApp();
      appWithErrorHandler.use(
        (
          err: Error,
          _req: express.Request,
          res: express.Response,
          _next: express.NextFunction,
        ) => {
          res.status(500).json({ message: err.message });
        },
      );

      const response = await request(appWithErrorHandler).get("/auth/signin");
      expect(response.status).to.equal(500);
      expect(response.body.message).to.equal(errorMessage);
    });
  });
});

function createApp() {
  const app = express();
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  app.use("/auth", authRouter);
  return app;
}
