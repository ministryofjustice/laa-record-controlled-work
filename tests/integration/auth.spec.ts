import createApp from "#/app.js";
import { Application } from "express";
import {
  GenericContainer,
  Wait,
  type StartedTestContainer,
} from "testcontainers";
import request from "supertest";
import { expect } from "chai";
import { FOUND, OK } from "#/lib/constants/httpStatus.js";
import { createClient } from "redis";
import config from "#/config.js";
import { SessionData } from "express-session";

const REDIS_PORT = 6379;
const IDP_PORT = 8080;

let redisContainer: StartedTestContainer;
let redisClient: ReturnType<typeof createClient>;
let idpContainer: StartedTestContainer;
let app: Application;
let authenticatedUser: ReturnType<typeof request.agent>;
let unauthenticatedUser: ReturnType<typeof request.agent>;

describe("Auth Integration", () => {
  before(async () => {
    [redisContainer, idpContainer] = await Promise.all([
      new GenericContainer("redis:7-alpine")
        .withExposedPorts(REDIS_PORT)
        .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
        .start(),

      new GenericContainer("ghcr.io/navikt/mock-oauth2-server:3.0.1")
        .withExposedPorts(IDP_PORT)
        .withWaitStrategy(
          Wait.forHttp("/default/.well-known/openid-configuration", IDP_PORT),
        )
        .start(),
    ]);

    config.entra.authority = `http://localhost:${idpContainer.getMappedPort(IDP_PORT)}/default`;
    config.redis.enabled = true;
    config.redis.url = `redis://localhost:${redisContainer.getMappedPort(REDIS_PORT)}`;
    process.env.PLAYWRIGHT_TEST_SIGNIN = "true";

    redisClient = createClient({ url: config.redis.url });
    await redisClient.connect();
    app = await createApp();
  });

  after(async () => {
    await redisClient.close();
    await Promise.all([redisContainer.stop(), idpContainer.stop()]);
  });

  beforeEach(async () => {
    authenticatedUser = request.agent(app);
    await authenticatedUser.get("/test/signin");
    unauthenticatedUser = request.agent(app);
  });

  afterEach(async () => {
    await redisClient.flushAll();
  });

  describe("GET /health", () => {
    it("returns healthy without auth", async () => {
      const res = await request(app).get("/health");
      expect(res.status).to.equal(OK);
      expect(res.text).to.equal("Healthy");
    });
  });

  describe("Get /landing", () => {
    it("redirects unauthenicated user to /auth/signin", async () => {
      const res = await unauthenticatedUser.get("/landing");
      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal("/auth/signin");
      // catch the redirect and extract state param from redirect url
      // skip auth
    });

    it("authenicated user lands on landing page", async () => {
      const res = await authenticatedUser.get("/landing");
      expect(res.status).to.equal(OK);
      expect(res.text).to.include("Stub Landing Page");
    });

    it("authenicated user will store session data in redis", async () => {
      await authenticatedUser.get("/landing");
      const keys = await redisClient.keys("sess:*");
      const raw = await redisClient.get(keys[0]);
      const session = JSON.parse(raw!) as SessionData;
      expect(session.isAuthenticated).to.equal(true);
      expect(session.account?.homeAccountId).to.equal(
        "test-uid.test-tenant-id",
      );
    });
  });
});
// TODO implement integration tests using testconatiners
// import { AuthService } from "#/services/auth.js";
// import { failure, success } from "#/lib/either.js";
// import { expect } from "chai";
// import express from "express";
// import sinon from "sinon";
// import request from "supertest";
// import {
//   BAD_REQUEST,
//   FOUND,
//   INTERNAL_SERVER_ERROR,
//   UNAUTHORIZED,
// } from "#/lib/constants/httpStatus.js";

// import createApp from "#/app.js";
// import { MissingAuthCodeRequestError, MsalError, StateMismatchError, TokenAcquisitionError } from "#/lib/errors/auth.js";
// import { MS_IN_TWELVE_HOURS } from "#/lib/constants/timeEnums.js";
// import SessionService from "#/services/sessionService.js";

// describe("authRoutes", () => {
//   let authServiceStub: {
//     getAuthCodeUrl: sinon.SinonStub;
//     processAuthCodeCallback: sinon.SinonStub;
//   };
//   let sessionServiceStub: {
//     getSessionConfig: sinon.SinonStub;
//   };
//   let app: express.Application;

//   before(async () => {
//     sessionServiceStub = {
//       getSessionConfig: sinon.stub().resolves({
//         secret: "test-secret-3",
//         resave: false,
//         saveUninitialized: false,
//         cookie: {
//           secure: false,
//           httpOnly: true,
//           maxAge: MS_IN_TWELVE_HOURS,
//         }, // NO REDIS
//       }),
//     };

//     sinon
//       .stub(SessionService, "create")
//       .returns(sessionServiceStub as unknown as SessionService);

//     app = await createApp();
//   });

//   const AUTH_CODE_URL = "https://login.microsoftonline.com/auth/";
//   const SUCCESS_REDIRECT = "/case/123";

//   beforeEach(() => {
//     authServiceStub = {
//       getAuthCodeUrl: sinon.stub().resolves(success(AUTH_CODE_URL)),
//       processAuthCodeCallback: sinon
//         .stub()
//         .resolves(success(SUCCESS_REDIRECT)),
//     };
//     sinon
//       .stub(AuthService, "create")
//       .returns(authServiceStub as unknown as AuthService);
//   });

//   afterEach(() => sinon.restore());

//   describe("POST /auth/code/callback", () => {
//     it("calls processAuthCodeCallback() and redirects to successRedirect", async () => {
//       const res = await request(app)
//         .post("/auth/code/callback")
//         .type("form")
//         .send({ code: "auth-code-abc", state: "encoded-state" });

//       expect(authServiceStub.processAuthCodeCallback.calledOnce).to.be.true;
//       expect(res.status).to.equal(FOUND);
//       expect(res.headers.location).to.equal(SUCCESS_REDIRECT);
//     });

//     it("responds with 400 when body.code is missing", async () => {
//       const res = await request(app)
//         .post("/auth/code/callback")
//         .type("form")
//         .send({ state: "encoded-state" });

//       expect(authServiceStub.processAuthCodeCallback.called).to.be.false;
//       expect(res.status).to.equal(BAD_REQUEST);
//     });

//     it("responds with 400 when processAuthCodeCallback returns MissingAuthCodeRequest", async () => {
//       authServiceStub.processAuthCodeCallback.resolves(
//         failure(MissingAuthCodeRequestError),
//       );

//       const res = await request(app)
//         .post("/auth/code/callback")
//         .type("form")
//         .send({ code: "auth-code-abc", state: "encoded-state" });

//       expect(res.status).to.equal(BAD_REQUEST);
//     });

//     it("responds with 400 when processAuthCodeCallback returns StateMismatchError", async () => {
//       authServiceStub.processAuthCodeCallback.resolves(
//         failure(StateMismatchError),
//       );

//       const res = await request(app)
//         .post("/auth/code/callback")
//         .type("form")
//         .send({ code: "auth-code-abc", state: "encoded-state" });

//       expect(res.status).to.equal(BAD_REQUEST);
//     });

//     it("responds with 401 when processAuthCodeCallback returns TokenAcquisitionError", async () => {
//       authServiceStub.processAuthCodeCallback.resolves(
//         failure(TokenAcquisitionError.from(new Error("MSAL"))),
//       );

//       const res = await request(app)
//         .post("/auth/code/callback")
//         .type("form")
//         .send({ code: "auth-code-abc", state: "encoded-state" });

//       expect(res.status).to.equal(UNAUTHORIZED);
//     });
//   });

//   describe("GET /auth/signin", () => {
//     it("redirects to the URL returned by authService.getAuthCodeUrl()", async () => {
//       const response = await request(app).get("/auth/signin");
//       expect(response.status).to.equal(FOUND);
//       expect(response.headers.location).to.equal(AUTH_CODE_URL);
//     });

//     it("responds with 500 when getAuthCodeUrl returns a MsalError", async () => {
//       authServiceStub.getAuthCodeUrl.resolves(
//         failure(MsalError.from(new Error("MSAL failure"))),
//       );

//       const response = await request(app).get("/auth/signin");
//       expect(response.status).to.equal(INTERNAL_SERVER_ERROR);
//     });
//   });
// });
