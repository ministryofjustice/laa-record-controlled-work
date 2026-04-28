import { AuthService } from "#src/services/auth.js";
import { failure, success } from "#src/lib/either.js";
import { expect } from "chai";
import express from "express";
import sinon from "sinon";
import request from "supertest";
import {
  BAD_REQUEST,
  FOUND,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#src/lib/constants/httpStatus.js";

import createApp from "#src/app.js";
import { MissingAuthCodeRequestError, MsalError, StateMismatchError, TokenAcquisitionError } from "#src/lib/errors/auth.js";
import { MS_IN_TWELVE_HOURS } from "#src/lib/constants/timeEnums.js";
import SessionService from "#src/services/sessionService.js";

describe("authRoutes", () => {
  let authServiceStub: {
    getAuthCodeUrl: sinon.SinonStub;
    processAuthCodeCallback: sinon.SinonStub;
  };
  let sessionServiceStub: {
    getSessionConfig: sinon.SinonStub;
  };
  let app: express.Application;

  before(async () => {
    sessionServiceStub = {
      getSessionConfig: sinon.stub().resolves({
        secret: "test-secret-3",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: false,
          httpOnly: true,
          maxAge: MS_IN_TWELVE_HOURS,
        }, // NO REDIS
      }),
    };

    sinon
      .stub(SessionService, "create")
      .returns(sessionServiceStub as unknown as SessionService);

    app = await createApp();
  });

  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth/";
  const SUCCESS_REDIRECT = "/case/123";

  beforeEach(() => {
    authServiceStub = {
      getAuthCodeUrl: sinon.stub().resolves(success(AUTH_CODE_URL)),
      processAuthCodeCallback: sinon
        .stub()
        .resolves(success(SUCCESS_REDIRECT)),
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

    it("responds with 400 when processAuthCodeCallback returns MissingAuthCodeRequest", async () => {
      authServiceStub.processAuthCodeCallback.resolves(
        failure(MissingAuthCodeRequestError),
      );

      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(res.status).to.equal(BAD_REQUEST);
    });

    it("responds with 400 when processAuthCodeCallback returns StateMismatchError", async () => {
      authServiceStub.processAuthCodeCallback.resolves(
        failure(StateMismatchError),
      );

      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(res.status).to.equal(BAD_REQUEST);
    });

    it("responds with 401 when processAuthCodeCallback returns TokenAcquisitionError", async () => {
      authServiceStub.processAuthCodeCallback.resolves(
        failure(TokenAcquisitionError.from(new Error("MSAL"))),
      );

      const res = await request(app)
        .post("/auth/code/callback")
        .type("form")
        .send({ code: "auth-code-abc", state: "encoded-state" });

      expect(res.status).to.equal(UNAUTHORIZED);
    });
  });

  describe("GET /auth/signin", () => {
    it("redirects to the URL returned by authService.getAuthCodeUrl()", async () => {
      const response = await request(app).get("/auth/signin");
      expect(response.status).to.equal(FOUND);
      expect(response.headers.location).to.equal(AUTH_CODE_URL);
    });

    it("responds with 500 when getAuthCodeUrl returns a MsalError", async () => {
      authServiceStub.getAuthCodeUrl.resolves(
        failure(MsalError.from(new Error("MSAL failure"))),
      );

      const response = await request(app).get("/auth/signin");
      expect(response.status).to.equal(INTERNAL_SERVER_ERROR);
    });
  });
});
