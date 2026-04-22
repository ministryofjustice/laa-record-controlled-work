import { AuthService } from "#src/services/auth.js";
import { expect } from "chai";
import express from "express";
import sinon from "sinon";
import request from "supertest";
import {
  FOUND,
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
} from "#src/constants/httpStatus.js";
import createApp from "#src/app.js";

describe("authRoutes", () => {
  let authServiceStub: {
    getAuthCodeUrl: sinon.SinonStub;
    processAuthCodeCallback: sinon.SinonStub;
  };
  let app: express.Application;

  before(async () => {
    app = await createApp();
  });

  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth/";
  const SUCCESS_REDIRECT = "/case/123";

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
  });

  afterEach(() => sinon.restore());

  describe("POST /auth/code/callback", () => {
    it("calls processAuthCodeCallback() and redirects to successRedirect", async () => {
      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(authServiceStub.processAuthCodeCallback.calledOnce).to.be.true;
      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal(SUCCESS_REDIRECT);
    });

    it("responds with 400 when body.code is missing", async () => {
      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ state: "encoded-state" });

      expect(authServiceStub.processAuthCodeCallback.called).to.be.false;
      expect(res.status).to.equal(BAD_REQUEST);
    });

    it("redirects to /auth/signin when processAuthCodeCallback() throws", async () => {
      authServiceStub.processAuthCodeCallback.rejects(new Error("MSAL failure"));

      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal("/auth/signin");
    });
  });
  

  describe("GET /auth/signin", () => {
    it("redirects to the URL returned by authService.getAuthCodeUrl()", async () => {
      const response = await request(app).get("/auth/signin");
      expect(response.status).to.equal(FOUND);
      expect(response.headers.location).to.equal(AUTH_CODE_URL);
    });

    it("calls next(error) when getAuthCodeUrl() throws", async () => {
      authServiceStub.getAuthCodeUrl.rejects(new Error("MSAL failure"));

      const response = await request(app).get("/auth/signin");
      expect(response.status).to.equal(INTERNAL_SERVER_ERROR);
    });
  });
});

// function createApp() {
//   const app = express();
//   app.use(express.urlencoded({ extended: false }));
//   app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
//   setupCsrf(app);
//   // Exposes a CSRF token so tests can make valid POST requests
//   app.get("/csrf-token", (req, res) => {
//     res.json({ csrfToken: req.csrfToken?.() });
//   });
//   app.use("/auth", authRouter);
//   // // Catches errors passed to next() so tests can assert on status/message
//   app.use(
//     (
//       err: Error,
//       _req: express.Request,
//       res: express.Response,
//       _next: express.NextFunction,
//     ) => {
//       res.status(INTERNAL_SERVER_ERROR).json({ message: err.message });
//     },
//   );
//   return app;
// }

