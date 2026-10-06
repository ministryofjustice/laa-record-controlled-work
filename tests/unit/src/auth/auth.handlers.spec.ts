import express from "express";
import type { NextFunction, Request, Response } from "express";
import session from "express-session";
import request from "supertest";
import { AuthError } from "@azure/msal-node";
import { randomUUID } from "node:crypto";
import {
  BAD_REQUEST,
  FORBIDDEN,
  FOUND,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#/lib/constants/http.js";
import sinon from "sinon";
import {
  createAuthFlowStore,
  getAuthFlowStore,
} from "#/auth/auth.flow-store.js";
import type { AuthCodeFlowState } from "#/auth/auth.types.js";
import { EntraService } from "#/auth/entra.service.js";
import { authCodeCallback, signIn } from "#/auth/auth.handlers.js";
import { getValidatedReturnTo } from "#/auth/auth.redirect.js";
import { createRelayState } from "#/auth/auth.relay.js";
import { getMsalCacheKey } from "#/auth/msal.cache-key.js";
import config from "#/config.js";
import { type Either, failure, success } from "#/lib/either.js";
import * as redis from "#/lib/redis.js";
import { expect } from "chai";
import { TokenAcquisitionError } from "#/auth/auth.errors.js";
import { MINUTE } from "#/lib/constants/time.js";
import { createMockApp } from "../../utils.js";
import { requireAuth } from "#/auth/middleware/requireAuth.middleware.js";

const AUTH_CODE_URL = "https://login.microsoftonline.com/auth";
const TRUSTED_APP_ORIGIN = new URL("https://rcw.invalid");
const CALLBACK_STATE = "test-state";
const RELAY_EXPIRY = Date.now() + 10 * MINUTE;

type RequestAgent = ReturnType<typeof request.agent>;

function getSetCookieHeaders(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function getValue<Err, Value>(result: Either<Err, Value>): Value {
  if ("error" in result) throw result.error;
  return result.value;
}

async function startSignIn(agent: RequestAgent): Promise<void> {
  const response = await agent.get("/auth/signin");
  expect(response.status, response.text).to.equal(FOUND);
}

async function storeFlow(
  sessionId: string,
  authState: string,
  returnTo = "/",
): Promise<void> {
  const store = getAuthFlowStore();
  const reservation = await store.reserve(sessionId);
  if (reservation.error) throw reservation.error;

  const published = await store.publish(
    sessionId,
    reservation.value.reservationId,
    {
      authCodeRequest: {
        code: "",
        codeVerifier: "verifier",
        redirectUri: "http://localhost/auth/code/callback",
        scopes: ["scope.read"],
      },
      authState,
      returnTo,
    },
  );
  if (published.error || !published.value) {
    throw published.error ?? new Error("Auth flow publication failed");
  }
}

function expectAllowedLocalLocation(location: unknown): void {
  expect(location).to.be.a("string");

  const localLocation = location as string;
  const resolvedLocation = new URL(localLocation, TRUSTED_APP_ORIGIN);
  expect(resolvedLocation.origin).to.equal(TRUSTED_APP_ORIGIN.origin);
  expect(getValidatedReturnTo(localLocation)).to.equal(localLocation);
}

describe("Auth Handlers", () => {
  let authServiceStub: {
    initiateAuthCodeFlow: sinon.SinonStub;
    exchangeAuthCode: sinon.SinonStub;
  };
  let mockApp: express.Application;

  before(() => {
    mockApp = createMockApp();
  });

  beforeEach(() => {
    authServiceStub = {
      initiateAuthCodeFlow: sinon.stub().resolves(
        success({
          authCodeUrl: AUTH_CODE_URL,
          authState: "test-state",
          returnTo: "/",
          authCodeRequest: {},
        }),
      ),
      exchangeAuthCode: sinon.stub().resolves(
        success({
          accessToken: "access-token",
          idToken: "id-token",
          account: {
            environment: "login.microsoftonline.com",
            homeAccountId: "test.user@example.com",
            localAccountId: "test-uid",
            tenantId: "test-tenant-id",
            username: "testuser@example.com",
          },
        }),
      ),
    };

    sinon
      .stub(EntraService, "create")
      .returns(authServiceStub as unknown as EntraService);
  });

  afterEach(() => {
    sinon.restore();
  });

  function createHandlerRequest(request: object): Request {
    return Object.assign(request, { app: mockApp }) as unknown as Request;
  }

  describe("signin()", () => {
    it("does not redirect a superseded sign-in when preparations finish out of order", async () => {
      let resolveOlder!: (value: ReturnType<typeof success>) => void;
      let resolveNewer!: (value: ReturnType<typeof success>) => void;
      const olderPreparation = new Promise<ReturnType<typeof success>>(
        (resolve) => {
          resolveOlder = resolve;
        },
      );
      const newerPreparation = new Promise<ReturnType<typeof success>>(
        (resolve) => {
          resolveNewer = resolve;
        },
      );
      authServiceStub.initiateAuthCodeFlow
        .onFirstCall()
        .returns(olderPreparation);
      authServiceStub.initiateAuthCodeFlow
        .onSecondCall()
        .returns(newerPreparation);

      const makeRequest = (): Request =>
        createHandlerRequest({
          hostname: "localhost",
          query: {},
          session: {
            save: (callback: (error?: Error) => void): void => callback(),
          },
          sessionID: "overlapping-session",
        });
      const olderResponse = {
        redirect: sinon.stub(),
        send: sinon.stub().returnsThis(),
        status: sinon.stub().returnsThis(),
        type: sinon.stub().returnsThis(),
      } as unknown as Response;
      const newerResponse = {
        redirect: sinon.stub(),
        send: sinon.stub().returnsThis(),
        status: sinon.stub().returnsThis(),
        type: sinon.stub().returnsThis(),
      } as unknown as Response;
      const next = sinon.stub();

      const olderSignin = signIn(makeRequest(), olderResponse, next);
      const newerSignin = signIn(makeRequest(), newerResponse, next);
      await Promise.resolve();
      resolveNewer(
        success({
          authCodeUrl: "https://login.example/newer",
          authState: "newer-state",
          returnTo: "/",
          authCodeRequest: {},
        }),
      );
      await newerSignin;
      resolveOlder(
        success({
          authCodeUrl: "https://login.example/older",
          authState: "older-state",
          returnTo: "/",
          authCodeRequest: {},
        }),
      );
      await olderSignin;

      expect((newerResponse.redirect as sinon.SinonStub).calledOnceWithExactly(
        "https://login.example/newer",
      )).to.be.true;
      expect((olderResponse.redirect as sinon.SinonStub).called).to.be.false;
    });

    it("keeps the newer flow when HTTP sign-ins finish preparation in reverse order", async () => {
      const agent = request.agent(mockApp);
      const established = await agent.get("/auth/signin");
      expect(established.status).to.equal(FOUND);
      expect(established.headers["set-cookie"]).to.exist;

      let resolveOlder!: (value: ReturnType<typeof success>) => void;
      let resolveNewer!: (value: ReturnType<typeof success>) => void;
      let markBothStarted!: () => void;
      let started = 0;
      const bothStarted = new Promise<void>((resolve) => {
        markBothStarted = resolve;
      });
      authServiceStub.initiateAuthCodeFlow.resetHistory();
      authServiceStub.initiateAuthCodeFlow.onCall(0).returns(
        new Promise<ReturnType<typeof success>>((resolve) => {
          resolveOlder = resolve;
          started += 1;
          if (started === 2) markBothStarted();
        }),
      );
      authServiceStub.initiateAuthCodeFlow.onCall(1).returns(
        new Promise<ReturnType<typeof success>>((resolve) => {
          resolveNewer = resolve;
          started += 1;
          if (started === 2) markBothStarted();
        }),
      );

      const olderResponse = agent.get("/auth/signin").then((response) => response);
      const newerResponse = agent.get("/auth/signin").then((response) => response);
      await bothStarted;
      resolveNewer(
        success({
          authCodeUrl: "https://login.example/newer",
          authCodeRequest: {},
          authState: "http-newer-state",
          returnTo: "/",
        }),
      );
      const newer = await newerResponse;
      resolveOlder(
        success({
          authCodeUrl: "https://login.example/older",
          authCodeRequest: {},
          authState: "http-older-state",
          returnTo: "/",
        }),
      );
      const older = await olderResponse;

      expect(newer.status).to.equal(FOUND);
      expect(newer.headers.location).to.equal("https://login.example/newer");
      expect(older.status).to.equal(INTERNAL_SERVER_ERROR);
      expect(older.headers.location).to.be.undefined;

      const staleCallback = await agent
        .get("/auth/code/callback")
        .query({ code: "auth-code", state: "http-older-state" });
      const currentCallback = await agent
        .get("/auth/code/callback")
        .query({ code: "auth-code", state: "http-newer-state" });

      expect(staleCallback.status).to.equal(BAD_REQUEST);
      expect(currentCallback.status).to.equal(FOUND);
      expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
      expect(
        authServiceStub.exchangeAuthCode.firstCall.args[0],
      ).to.equal("auth-code");
    });

    it("does not redirect when HTTP preparation reaches the flow deadline", async () => {
      let now = 1_800_000_000_000;
      const app = createMockApp();
      app.locals.authFlowStore = createAuthFlowStore({ now: () => now });
      const agent = request.agent(app);
      const established = await agent.get("/auth/signin");

      let resolvePreparation!: (value: AuthCodeFlowState) => void;
      let markPreparationStarted!: () => void;
      const preparationStarted = new Promise<void>((resolve) => {
        markPreparationStarted = resolve;
      });
      const preparation = new Promise<AuthCodeFlowState>((resolve) => {
        resolvePreparation = resolve;
      });
      authServiceStub.initiateAuthCodeFlow.onCall(1).callsFake(() => {
        markPreparationStarted();
        return preparation.then(success);
      });

      const signin = agent.get("/auth/signin").then((response) => response);
      await preparationStarted;
      now += 10 * MINUTE;
      resolvePreparation(
        {
          authCodeUrl: "https://login.example/expired",
          authCodeRequest: {
            code: "",
            codeVerifier: "verifier",
            redirectUri: config.entra.redirectUri,
            scopes: ["scope.read"],
          },
          authState: "expired-preparation-state",
          returnTo: "/",
        },
      );

      const signinResponse = await signin;
      const callback = await agent.get("/auth/code/callback").query({
        code: "auth-code",
        state: "expired-preparation-state",
      });

      expect(established.status).to.equal(FOUND);
      expect(signinResponse.status).to.equal(INTERNAL_SERVER_ERROR);
      expect(signinResponse.headers.location).to.be.undefined;
      expect(callback.status).to.equal(BAD_REQUEST);
      expect(authServiceStub.exchangeAuthCode.called).to.be.false;
    });

    it("rejects a callback when a newer signin replaces an authorized HTTP flow", async () => {
      const flowStore = createAuthFlowStore();
      const app = createMockApp();
      app.locals.authFlowStore = flowStore;
      const agent = request.agent(app);
      const established = await agent.get("/auth/signin");

      const authorizeRedirect = flowStore.authorizeRedirect.bind(flowStore);
      let markOlderAuthorized!: () => void;
      let releaseOlderResponse!: () => void;
      let olderAuthorization: Either<Error, boolean> | undefined;
      const olderAuthorized = new Promise<void>((resolve) => {
        markOlderAuthorized = resolve;
      });
      const responseGate = new Promise<void>((resolve) => {
        releaseOlderResponse = resolve;
      });
      sinon.stub(flowStore, "authorizeRedirect").callsFake(
        async (sessionId, reservationId) => {
          const result = await authorizeRedirect(sessionId, reservationId);
          if (olderAuthorization === undefined) {
            olderAuthorization = result;
            markOlderAuthorized();
            await responseGate;
          }
          return result;
        },
      );

      authServiceStub.initiateAuthCodeFlow.resetHistory();
      authServiceStub.initiateAuthCodeFlow.onCall(0).resolves(
        success({
          authCodeUrl: "https://login.example/older",
          authCodeRequest: {},
          authState: "authorized-older-state",
          returnTo: "/",
        }),
      );
      authServiceStub.initiateAuthCodeFlow.onCall(1).resolves(
        success({
          authCodeUrl: "https://login.example/newer",
          authCodeRequest: {},
          authState: "authorized-newer-state",
          returnTo: "/",
        }),
      );

      const olderSignin = agent.get("/auth/signin").then((response) => response);
      await olderAuthorized;
      const newerSignin = await agent.get("/auth/signin");
      releaseOlderResponse();
      const olderResponse = await olderSignin;

      const staleCallback = await agent.get("/auth/code/callback").query({
        code: "older-code",
        state: "authorized-older-state",
      });
      const currentCallback = await agent.get("/auth/code/callback").query({
        code: "newer-code",
        state: "authorized-newer-state",
      });

      expect(established.status).to.equal(FOUND);
      if (
        olderAuthorization === undefined ||
        !("value" in olderAuthorization)
      ) {
        throw new Error("Older signin authorization did not succeed");
      }
      expect(olderAuthorization.value).to.be.true;
      expect(newerSignin.status).to.equal(FOUND);
      expect(newerSignin.headers.location).to.equal(
        "https://login.example/newer",
      );
      expect(olderResponse.status).to.equal(FOUND);
      expect(olderResponse.headers.location).to.equal(
        "https://login.example/older",
      );
      expect(staleCallback.status).to.equal(BAD_REQUEST);
      expect(currentCallback.status).to.equal(FOUND);
      expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
    });

    it("preserves a newer HTTP flow when an older session save fails late", async () => {
      sinon.stub(config.redis, "enabled").value(false);
      const sessionStore = new session.MemoryStore();
      const originalSet = sessionStore.set.bind(sessionStore);
      let holdOlderSave = false;
      let markOlderSaveStarted!: () => void;
      let releaseOlderSave!: () => void;
      let markOlderPreparationStarted!: () => void;
      let resolveOlderPreparation!: (value: ReturnType<typeof success>) => void;
      const olderSaveStarted = new Promise<void>((resolve) => {
        markOlderSaveStarted = resolve;
      });
      const olderPreparationStarted = new Promise<void>((resolve) => {
        markOlderPreparationStarted = resolve;
      });
      const olderPreparation = new Promise<ReturnType<typeof success>>(
        (resolve) => {
          resolveOlderPreparation = resolve;
        },
      );
      sinon.stub(sessionStore, "set").callsFake(
        (sessionId, sessionData, callback) => {
          if (holdOlderSave && sessionData.authFlowPending !== undefined) {
            holdOlderSave = false;
            markOlderSaveStarted();
            releaseOlderSave = () =>
              callback?.(new Error("stale session save failed"));
            return;
          }
          originalSet(sessionId, sessionData, callback);
        },
      );
      const flowStore = createAuthFlowStore();
      const app = createMockApp({ sessionStore });
      app.locals.authFlowStore = flowStore;
      authServiceStub.initiateAuthCodeFlow.onCall(1).callsFake(() => {
        markOlderPreparationStarted();
        return olderPreparation;
      });
      authServiceStub.initiateAuthCodeFlow.onCall(2).resolves(
        success({
          authCodeUrl: "https://login.example/newer",
          authCodeRequest: {},
          authState: "newer-http-save-state",
          returnTo: "/",
        }),
      );

      const agent = request.agent(app);
      const established = await agent.get("/auth/signin");
      expect(established.status).to.equal(FOUND);
      holdOlderSave = true;
      const olderRequest = agent
        .get("/auth/signin")
        .then((response) => response);
      await olderPreparationStarted;
      resolveOlderPreparation(
        success({
          authCodeUrl: "https://login.example/older",
          authCodeRequest: {},
          authState: "older-http-save-state",
          returnTo: "/",
        }),
      );
      await olderSaveStarted;

      const newer = await agent.get("/auth/signin");
      releaseOlderSave();
      const older = await olderRequest;
      const staleCallback = await agent
        .get("/auth/code/callback")
        .query({ code: "old-code", state: "older-http-save-state" });
      const newerCallback = await agent
        .get("/auth/code/callback")
        .query({ code: "new-code", state: "newer-http-save-state" });

      expect(newer.status).to.equal(FOUND);
      expect(newer.headers.location).to.equal("https://login.example/newer");
      expect(older.status).to.equal(INTERNAL_SERVER_ERROR);
      expect(staleCallback.status).to.equal(BAD_REQUEST);
      expect(newerCallback.status).to.equal(FOUND);
      expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
    });

    it("preserves a newer flow when an older session save fails late", async () => {
      const sessionId = randomUUID();
      let releaseOlderSave!: () => void;
      let markOlderSaveStarted!: () => void;
      const olderSaveStarted = new Promise<void>((resolve) => {
        markOlderSaveStarted = resolve;
      });
      authServiceStub.initiateAuthCodeFlow
        .onFirstCall()
        .resolves(
          success({
            authCodeUrl: "https://login.example/older",
            authCodeRequest: {},
            authState: "older-save-state",
            returnTo: "/",
          }),
        );
      authServiceStub.initiateAuthCodeFlow
        .onSecondCall()
        .resolves(
          success({
            authCodeUrl: "https://login.example/newer",
            authCodeRequest: {},
            authState: "newer-save-state",
            returnTo: "/",
          }),
        );
      const makeRequest = (
        save: (callback: (error?: Error | null) => void) => void,
      ): Request =>
        createHandlerRequest({
          hostname: "localhost",
          query: {},
          session: { save },
          sessionID: sessionId,
        });
      const olderRequest = makeRequest((callback) => {
        markOlderSaveStarted();
        releaseOlderSave = () => callback(new Error("stale session save failed"));
      });
      const newerRequest = makeRequest((callback) => callback());
      const olderRedirect = sinon.stub();
      const newerRedirect = sinon.stub();
      const makeResponse = (redirect: sinon.SinonStub): Response =>
        ({
          redirect,
          send: sinon.stub().returnsThis(),
          status: sinon.stub().returnsThis(),
          type: sinon.stub().returnsThis(),
        }) as unknown as Response;

      const olderSignin = signIn(
        olderRequest,
        makeResponse(olderRedirect),
        sinon.stub() as unknown as NextFunction,
      );
      await olderSaveStarted;
      const newerSignin = signIn(
        newerRequest,
        makeResponse(newerRedirect),
        sinon.stub() as unknown as NextFunction,
      );
      await newerSignin;
      releaseOlderSave();
      await olderSignin;

      expect(newerRedirect.calledOnceWithExactly(
        "https://login.example/newer",
      )).to.be.true;
      expect(olderRedirect.called).to.be.false;
      expect(
        getValue(
          await getAuthFlowStore().consume(sessionId, "newer-save-state"),
        )?.authState,
      ).to.equal("newer-save-state");
    });

    it("does not authorize a signin when its session save reaches the flow deadline", async () => {
      let now = 1_800_000_000_000;
      const expiresAt = now + 10 * MINUTE;
      const flowStore = getAuthFlowStore();
      sinon.stub(flowStore, "reserve").returns(
        success({ expiresAt, reservationId: "save-delay-reservation" }),
      );
      sinon.stub(flowStore, "publish").returns(success(true));
      const authorize = sinon
        .stub(flowStore, "authorizeRedirect")
        .callsFake(() => success(now < expiresAt));
      sinon.stub(flowStore, "abandon").returns(success(undefined));
      let markSaveStarted!: () => void;
      let releaseSave!: () => void;
      const saveStarted = new Promise<void>((resolve) => {
        markSaveStarted = resolve;
      });
      const saveGate = new Promise<void>((resolve) => {
        releaseSave = resolve;
      });
      const req = createHandlerRequest({
        hostname: "localhost",
        query: {},
        session: {
          save: (callback: (error?: Error | null) => void): void => {
            markSaveStarted();
            void saveGate.then(() => {
              now = expiresAt;
              callback();
            });
          },
        },
        sessionID: "signin-save-expiry",
      });
      const redirect = sinon.stub();
      const status = sinon.stub().returnsThis();
      const send = sinon.stub().returnsThis();
      const res = { redirect, send, status } as unknown as Response;

      const signin = signIn(req, res, sinon.stub() as unknown as NextFunction);
      await saveStarted;
      releaseSave();
      await signin;

      expect(authorize.calledOnce).to.be.true;
      expect(now).to.equal(expiresAt);
      expect(status.calledOnceWithExactly(INTERNAL_SERVER_ERROR)).to.be.true;
      expect(send.calledOnceWithExactly("Unable to start sign-in")).to.be.true;
      expect(redirect.called).to.be.false;
    });

    it("redirects to the auth code URL returned by initiateAuthCodeFlow()", async () => {
      const res = await request(mockApp).get("/auth/signin");

      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal(AUTH_CODE_URL);
    });

    it("uses returnTo query parameter when it is a safe app-relative path", async () => {
      const returnTo = "/cases/123";

      const res = await request(mockApp)
        .get("/auth/signin")
        .query({ returnTo });

      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal(AUTH_CODE_URL);
      expect(authServiceStub.initiateAuthCodeFlow.calledOnceWith(returnTo)).to
        .be.true;
    });

    it("uses / when returnTo is not a safe app-relative path", async () => {
      const res = await request(mockApp)
        .get("/auth/signin")
        .query({ returnTo: "https://example.com/evil" });

      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal(AUTH_CODE_URL);
      expect(authServiceStub.initiateAuthCodeFlow.calledOnceWith("/")).to.be
        .true;
    });

    for (const returnTo of [
      "/auth",
      "/auth/code/callback",
      "/AUTH/signin",
      "/%61uth/code/callback",
      "/cases/%2e%2e/auth/code/callback",
      "/%2fauth/code/callback",
      "/%5cauth/code/callback",
      "/cases/%252f%252fauth",
      "/cases/%ZZ",
      "/cases/%00",
      "/\\external.invalid",
    ]) {
      it(`uses / for unsafe returnTo ${returnTo}`, async () => {
        await request(mockApp).get("/auth/signin").query({ returnTo });

        expect(
          authServiceStub.initiateAuthCodeFlow.calledOnceWithExactly("/", {
            callbackHostname: "127.0.0.1",
            expiresAt: sinon.match.number,
          }),
        ).to.be.true;
      });
    }

    it("preserves authentication-like prefixes and escaped query values", async () => {
      const returnTo = "/authentication?next=%2Fauth#summary";

      await request(mockApp).get("/auth/signin").query({ returnTo });

      expect(
        authServiceStub.initiateAuthCodeFlow.calledOnceWith(returnTo),
      ).to.be.true;
    });

    it("uses / for repeated returnTo query values", async () => {
      await request(mockApp).get(
        "/auth/signin?returnTo=%2Fcases&returnTo=%2Fauth",
      );

      expect(
        authServiceStub.initiateAuthCodeFlow.calledOnceWith("/", {
          callbackHostname: "127.0.0.1",
          expiresAt: sinon.match.number,
        }),
      ).to.be.true;
    });

    it("uses the validated saved destination when returnTo is absent", async () => {
      const req = createHandlerRequest({
        hostname: "localhost",
        query: {},
        session: {
          returnTo: "/authentication",
          save: (callback: (error?: Error) => void): void => callback(),
        },
        sessionID: "session-id",
      });
      const res = {
        redirect: sinon.stub(),
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
      } as unknown as Response;
      const next = sinon.stub();

      await signIn(req, res, next);

      expect(
        authServiceStub.initiateAuthCodeFlow.calledOnceWith(
          "/authentication",
        ),
      ).to.be.true;
    });

    it("replaces a poisoned saved destination with /", async () => {
      const req = createHandlerRequest({
        hostname: "localhost",
        query: {},
        session: {
          returnTo: "https://attacker.example/collect",
          save: (callback: (error?: Error) => void): void => callback(),
        },
        sessionID: "session-id",
      });
      const res = {
        redirect: sinon.stub(),
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
      } as unknown as Response;
      const next = sinon.stub();

      await signIn(req, res, next);

      expect(
        authServiceStub.initiateAuthCodeFlow.calledOnceWith("/", {
          callbackHostname: "localhost",
          expiresAt: sinon.match.number,
        }),
      ).to.be.true;
    });

    it("returns a generic error when initiateAuthCodeFlow() fails", async () => {
      const errorMessage = "MSAL failure";
      const error = new Error(errorMessage);
      authServiceStub.initiateAuthCodeFlow.resolves(failure(error));

      const res = await request(mockApp).get("/auth/signin");

      expect(res.status).to.equal(INTERNAL_SERVER_ERROR);
      expect(res.text).to.equal("Unable to start sign-in");
      expect(res.headers["content-type"]).to.match(/^text\/plain/);
    });

    // Skipped because this test relies on rendering the error page, and we can't do that currently.
    // See https://dsdmoj.atlassian.net/browse/MEM-1441
    it.skip("renders the no-assigned-role error page when Entra reports the user has no role", async () => {
      authServiceStub.initiateAuthCodeFlow.rejects(
        new AuthError("1003009", "test-correlation-id", "No assigned role"),
      );

      const res = await request(mockApp).get("/auth/signin");

      expect(res.status).to.equal(FORBIDDEN);
      expect(res.text).to.contain("Service not accessible");
      expect(res.text).to.contain(
        "Your Legal Aid Services user account has not been assigned access to this service.",
      );
    });

    it("does not redirect or retain a flow when initiating-session save fails", async () => {
      const sessionId = randomUUID();
      const req = createHandlerRequest({
        hostname: "localhost",
        query: {},
        session: {
          save: (callback: (error?: Error) => void): void =>
            callback(new Error("session save failed")),
        },
        sessionID: sessionId,
      });
      const redirect = sinon.stub();
      const status = sinon.stub().returnsThis();
      const res = {
        redirect,
        send: sinon.stub().returnsThis(),
        status,
        type: sinon.stub().returnsThis(),
      } as unknown as Response;

      await signIn(req, res, sinon.stub() as unknown as NextFunction);
      const remaining = await getAuthFlowStore().consume(
        sessionId,
        CALLBACK_STATE,
      );

      expect(status.calledOnceWithExactly(INTERNAL_SERVER_ERROR)).to.be.true;
      expect(redirect.called).to.be.false;
      expect((res.send as sinon.SinonStub).calledOnceWithExactly(
        "Unable to start sign-in",
      )).to.be.true;
      expect(remaining.error).to.be.undefined;
      if (remaining.error) return;
      expect(remaining.value).to.be.undefined;
    });
  });

  describe("authCodeCallback()", () => {
    const QUERY_PARAMS = { code: "auth-code-abc", state: CALLBACK_STATE };

    it("consumes a flow once when callbacks use the initiating session cookie", async () => {
      const agent = request.agent(mockApp);
      const signin = await agent.get("/auth/signin");
      expect(signin.status).to.equal(FOUND);
      const cookies: string[] = Array.isArray(signin.headers["set-cookie"])
        ? signin.headers["set-cookie"]
        : [];
      expect(
        cookies.some((cookie) => cookie.startsWith(`${config.session.name}=`)),
      ).to.be.true;

      const otherSessionCallback = await request(mockApp)
        .get("/auth/code/callback")
        .query(QUERY_PARAMS);
      expect(otherSessionCallback.status).to.equal(BAD_REQUEST);
      expect(authServiceStub.exchangeAuthCode.called).to.be.false;

      const first = await agent
        .get("/auth/code/callback")
        .query({ code: QUERY_PARAMS.code, state: "test-state" });
      const replay = await agent
        .get("/auth/code/callback")
        .query({ code: QUERY_PARAMS.code, state: "test-state" });

      expect(first.status).to.equal(FOUND);
      expect(replay.status).to.equal(BAD_REQUEST);
      expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
    });

    it("leaves a flow usable after malformed callback payloads", async () => {
      const agent = request.agent(mockApp);
      await startSignIn(agent);

      for (const query of [
        { code: "auth-code", error: "access_denied", state: CALLBACK_STATE },
        { code: "auth-code", state: [CALLBACK_STATE, "other-state"] },
        { error: "access_denied" },
      ]) {
        const malformed = await agent
          .get("/auth/code/callback")
          .query(query);
        expect(malformed.status).to.equal(BAD_REQUEST);
      }

      const valid = await agent
        .get("/auth/code/callback")
        .query(QUERY_PARAMS);

      expect(valid.status).to.equal(FOUND);
      expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
    });

    it("redirects to returnTo on success", async () => {
      const agent = request.agent(mockApp);
      await startSignIn(agent);
      const res = await agent.get("/auth/code/callback").query(QUERY_PARAMS);

      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal("/");
      expectAllowedLocalLocation(res.headers.location);
    });

    it("stores account and msal homeAccountId in session without token fields", async () => {
      const agent = request.agent(mockApp);
      await startSignIn(agent);

      const callbackResponse = await agent
        .get("/auth/code/callback")
        .query(QUERY_PARAMS);
      expect(callbackResponse.status).to.equal(FOUND);
      expectAllowedLocalLocation(callbackResponse.headers.location);

      const sessionResponse = await agent.get("/test/session");
      expect(sessionResponse.status).to.equal(200);
      expect(sessionResponse.body.account).to.include({
        homeAccountId: "test.user@example.com",
      });
      expect(sessionResponse.body.msal).to.deep.equal({
        homeAccountId: "test.user@example.com",
      });
      expect(sessionResponse.body).to.not.have.property("accessToken");
      expect(sessionResponse.body).to.not.have.property("idToken");
    });

    it("responds with 400 when auth request body doesn't match schema", async () => {
      const wrongQueryParams = { missing: "property" };

      const res = await request(mockApp)
        .get("/auth/code/callback")
        .query(wrongQueryParams);

      expect(authServiceStub.exchangeAuthCode.called).to.be.false;
      expect(res.status).to.equal(BAD_REQUEST);
      expect(res.text).to.equal("Invalid redirect payload");
    });

    it("returns a generic error when the provider rejects authentication", async () => {
      const agent = request.agent(mockApp);
      await startSignIn(agent);
      const res = await agent.get("/auth/code/callback").query({
        error: "invalid_scope",
        error_description: "<script>alert(1)</script>",
        state: CALLBACK_STATE,
      });

      expect(authServiceStub.exchangeAuthCode.called).to.be.false;
      expect(res.status).to.equal(BAD_REQUEST);
      expect(res.text).to.equal("Entra sign-in failed");
      expect(res.headers["content-type"]).to.match(/^text\/plain/);
    });

    it("responds with 401 when token exchange fails", async () => {
      const error = new TokenAcquisitionError();
      authServiceStub.exchangeAuthCode.resolves(failure(error));

      const agent = request.agent(mockApp);
      await startSignIn(agent);
      const res = await agent.get("/auth/code/callback").query(QUERY_PARAMS);

      expect(res.status).to.equal(UNAUTHORIZED);
      expect(res.text).to.equal("Token acquisition failed");
      expect(res.headers["content-type"]).to.match(/^text\/plain/);
      const replay = await agent
        .get("/auth/code/callback")
        .query(QUERY_PARAMS);

      expect(replay.status).to.equal(BAD_REQUEST);
      expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
    });

    it("does not restore consumed state when session rotation fails", async () => {
      const sessionId = randomUUID();
      await storeFlow(sessionId, CALLBACK_STATE);
      const next = sinon.stub();
      const req = createHandlerRequest({
        query: QUERY_PARAMS,
        sessionID: sessionId,
        session: {
          regenerate: (callback: (error?: Error | null) => void): void =>
            callback(new Error("session rotation failed")),
        },
          });
      const res = {
        redirect: sinon.stub(),
        send: sinon.stub().returnsThis(),
        set: sinon.stub().returnsThis(),
        status: sinon.stub().returnsThis(),
      } as unknown as Response;

      await authCodeCallback(req, res, next as unknown as NextFunction);
      const replay = await getAuthFlowStore().consume(
        sessionId,
        CALLBACK_STATE,
      );

      expect(next.calledOnce).to.be.true;
      expect(authServiceStub.exchangeAuthCode.called).to.be.false;
      expect(getValue(replay)).to.be.undefined;
    });

    it("finishes a consumed callback while a new signin starts", async () => {
      const sessionId = randomUUID();
      await storeFlow(sessionId, CALLBACK_STATE);
      let markExchangeStarted!: () => void;
      let resolveExchange!: (result: ReturnType<typeof success>) => void;
      const exchangeStarted = new Promise<void>((resolve) => {
        markExchangeStarted = resolve;
      });
      const delayedExchange = new Promise<ReturnType<typeof success>>(
        (resolve) => {
          resolveExchange = resolve;
        },
      );
      authServiceStub.exchangeAuthCode.callsFake(() => {
        markExchangeStarted();
        return delayedExchange;
      });
      authServiceStub.initiateAuthCodeFlow.onFirstCall().resolves(
        success({
          authCodeUrl: "https://login.example/new",
          authCodeRequest: {},
          authState: "new-signin-state",
          returnTo: "/",
        }),
      );
      const callbackRedirect = sinon.stub();
      const callbackReq = createHandlerRequest({
        hostname: "localhost",
        query: QUERY_PARAMS,
        sessionID: sessionId,
        session: {
          regenerate: (callback: (error?: Error | null) => void): void => {
            callbackReq.sessionID = "rotated-callback-session";
            callbackReq.session = {
              save: (saveCallback: (error?: Error | null) => void): void =>
                saveCallback(),
            } as Request["session"];
            callback();
          },
          save: (callback: (error?: Error | null) => void): void => callback(),
        },
      });
      const callbackRes = {
        clearCookie: sinon.stub(),
        redirect: callbackRedirect,
        send: sinon.stub().returnsThis(),
        set: sinon.stub().returnsThis(),
        status: sinon.stub().returnsThis(),
      } as unknown as Response;
      const callback = authCodeCallback(
        callbackReq,
        callbackRes,
        sinon.stub() as unknown as NextFunction,
      );
      await exchangeStarted;

      const signinRedirect = sinon.stub();
      const signinReq = createHandlerRequest({
        hostname: "localhost",
        query: {},
        sessionID: sessionId,
        session: {
          save: (saveCallback: (error?: Error | null) => void): void =>
            saveCallback(),
        },
      });
      await signIn(
        signinReq,
        {
          redirect: signinRedirect,
          send: sinon.stub().returnsThis(),
          status: sinon.stub().returnsThis(),
        } as unknown as Response,
        sinon.stub() as unknown as NextFunction,
      );
      resolveExchange(
        success({
          accessToken: "access-token",
          account: {
            environment: "login.microsoftonline.com",
            homeAccountId: "account-id",
            localAccountId: "local-id",
            tenantId: "tenant-id",
            username: "user",
          },
          idToken: "id-token",
        }),
      );
      await callback;

      expect(signinRedirect.calledOnceWithExactly("https://login.example/new"))
        .to.be.true;
      expect(callbackRedirect.calledOnceWithExactly("/")).to.be.true;
      expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
      expect(
        getValue(
          await getAuthFlowStore().consume(sessionId, "new-signin-state"),
        )?.authState,
      ).to.equal("new-signin-state");
    });

    it("responds with 401 when token exchange result has no account homeAccountId", async () => {
      authServiceStub.exchangeAuthCode.resolves(
        success({
          accessToken: "access-token",
          account: undefined,
          idToken: "id-token",
        }),
      );

      const agent = request.agent(mockApp);
      await startSignIn(agent);
      const res = await agent.get("/auth/code/callback").query(QUERY_PARAMS);

      expect(res.status).to.equal(UNAUTHORIZED);
      expect(res.text).to.equal("Token acquisition failed");
    });

    it("destroys a failed authenticated session and does not restore its consumed flow", async () => {
      const sessionId = randomUUID();
      await storeFlow(sessionId, CALLBACK_STATE);
      sinon.stub(config.redis, "enabled").value(true);
      const redisClient = redis.getRedisClient();
      const deleteCache = sinon.stub(redisClient, "del").resolves(1);
      const status = sinon.stub().returnsThis();
      const redirect = sinon.stub();
      const clearCookie = sinon.stub();
      const req = createHandlerRequest({
        query: QUERY_PARAMS,
        sessionID: sessionId,
        session: {
          regenerate: (callback: (error?: Error | null) => void): void => {
            req.sessionID = "new-authenticated-session";
            req.session = {
              save: (saveCallback: (error?: Error | null) => void): void =>
                saveCallback(new Error("session store unavailable")),
              destroy: (destroyCallback: (error?: Error | null) => void): void => {
                (req as unknown as { session?: Request["session"] }).session =
                  undefined;
                destroyCallback();
              },
            } as Request["session"];
            callback();
          },
        },
      });
      const res = {
        clearCookie,
        redirect,
        send: sinon.stub().returnsThis(),
        set: sinon.stub().returnsThis(),
        status,
      } as unknown as Response;

      await authCodeCallback(req, res, sinon.stub() as unknown as NextFunction);
      const replay = await getAuthFlowStore().consume(
        sessionId,
        CALLBACK_STATE,
      );

      expect(status.calledOnceWithExactly(INTERNAL_SERVER_ERROR)).to.be.true;
      expect(redirect.called).to.be.false;
      expect(clearCookie.calledOnceWithExactly(config.session.name)).to.be.true;
      expect(deleteCache.calledOnce).to.be.true;
      expect(deleteCache.firstCall.args[0]).to.include(
        "new-authenticated-session",
      );
      expect(req.session).to.be.undefined;
      expect(replay.error).to.be.undefined;
      if (replay.error) return;
      expect(replay.value).to.be.undefined;
    });

    for (const cleanupFailure of ["destroy", "msal-cache"] as const) {
      it(`does not persist failed authentication when ${cleanupFailure} cleanup fails`, async () => {
        const sessionStore = new session.MemoryStore();
        const redisWasEnabled = config.redis.enabled;
        config.redis.enabled = false;
        const flowStore = createAuthFlowStore();
        config.redis.enabled = redisWasEnabled;
        const originalSet = sessionStore.set.bind(sessionStore);
        const originalDestroy = sessionStore.destroy.bind(sessionStore);
        let failAuthenticatedSave = false;
        let failedSessionId: string | undefined;
        let authenticatedSaveAttempts = 0;
        sinon.stub(sessionStore, "set").callsFake(
          (sessionId, sessionData, callback) => {
            if (failAuthenticatedSave && sessionData.isAuthenticated) {
              authenticatedSaveAttempts += 1;
              failedSessionId = sessionId;
              callback?.(new Error("session save failed"));
              return;
            }
            originalSet(sessionId, sessionData, callback);
          },
        );
        const destroy = sinon.stub(sessionStore, "destroy").callsFake(
          (sessionId, callback) => {
            if (
              cleanupFailure === "destroy" &&
              sessionId === failedSessionId
            ) {
              callback?.(new Error("session destroy failed"));
              return;
            }
            originalDestroy(sessionId, callback);
          },
        );
        const app = createMockApp({ sessionStore });
        app.locals.authFlowStore = flowStore;
        app.get("/test/protected", requireAuth(), (_req, res) => {
          res.sendStatus(200);
        });

        const redisEnabled = sinon.stub(config.redis, "enabled").value(false);
        const deleteCache = sinon.stub(redis.getRedisClient(), "del");
        if (cleanupFailure === "msal-cache") {
          deleteCache.rejects(new Error("MSAL cache deletion failed"));
        } else {
          deleteCache.resolves(1);
        }

        const unrelatedAgent = request.agent(app);
        await startSignIn(unrelatedAgent);
        const unrelatedCallback = await unrelatedAgent
          .get("/auth/code/callback")
          .query({ code: "unrelated-code", state: CALLBACK_STATE });
        expect(unrelatedCallback.status).to.equal(FOUND);

        authServiceStub.initiateAuthCodeFlow.onCall(1).resolves(
          success({
            authCodeUrl: "https://login.example/older",
            authCodeRequest: {},
            authState: "older-state",
            returnTo: "/",
          }),
        );
        authServiceStub.initiateAuthCodeFlow.onCall(2).resolves(
          success({
            authCodeUrl: "https://login.example/newer",
            authCodeRequest: {},
            authState: "newer-state",
            returnTo: "/",
          }),
        );
        let markExchangeStarted!: () => void;
        let resolveExchange!: (result: ReturnType<typeof success>) => void;
        const exchangeStarted = new Promise<void>((resolve) => {
          markExchangeStarted = resolve;
        });
        const delayedExchange = new Promise<ReturnType<typeof success>>(
          (resolve) => {
            resolveExchange = resolve;
          },
        );
        authServiceStub.exchangeAuthCode.onCall(1).callsFake(() => {
          markExchangeStarted();
          return delayedExchange;
        });

        const agent = request.agent(app);
        const signin = await agent.get("/auth/signin");
        const initialCookie = getSetCookieHeaders(
          signin.headers["set-cookie"],
        )
          .find((cookie) => cookie.startsWith(`${config.session.name}=`))!
          .split(";", 1)[0];
        failAuthenticatedSave = true;
        const callbackPromise = agent
          .get("/auth/code/callback")
          .query({ code: "older-code", state: "older-state" })
          .then((response) => response);
        await exchangeStarted;

        const newerSignin = await agent.get("/auth/signin");
        const newerCookie =
          getSetCookieHeaders(newerSignin.headers["set-cookie"])
            .find((cookie) => cookie.startsWith(`${config.session.name}=`))
            ?.split(";", 1)[0] ?? initialCookie;
        expect(newerSignin.status).to.equal(FOUND);
        redisEnabled.value(true);
        resolveExchange(
          success({
            accessToken: "access-token",
            account: {
              environment: "login.microsoftonline.com",
              homeAccountId: "target-account",
              localAccountId: "target-id",
              tenantId: "target-tenant",
              username: "target-user",
            },
            idToken: "id-token",
          }),
        );
        const failedCallback = await callbackPromise;
        failAuthenticatedSave = false;
        const persistedFailedSession = await new Promise<unknown>(
          (resolve, reject) => {
            sessionStore.get(failedSessionId!, (error, value) => {
              if (error) reject(error);
              else resolve(value);
            });
          },
        );

        expect(failedCallback.status).to.equal(INTERNAL_SERVER_ERROR);
        expect(failedCallback.headers.location).to.be.undefined;
        expect(
          getSetCookieHeaders(failedCallback.headers["set-cookie"]).some(
            (cookie) =>
              cookie.startsWith(`${config.session.name}=;`) &&
              /expires=|max-age=0/i.test(cookie),
          ),
        ).to.be.true;
        expect(failedSessionId).to.be.a("string");
        expect(authenticatedSaveAttempts).to.equal(1);
        expect(persistedFailedSession).to.be.undefined;
        expect(destroy.calledWith(failedSessionId)).to.be.true;
        expect(deleteCache.calledOnce).to.be.true;
        expect(deleteCache.firstCall.args[0]).to.equal(
          getMsalCacheKey(failedSessionId!),
        );

        const replay = await request(app)
          .get("/auth/code/callback")
          .set("Cookie", initialCookie)
          .query({ code: "older-code", state: "older-state" });
        const protectedAccess = await agent.get("/test/protected");
        const newerCallback = await request(app)
          .get("/auth/code/callback")
          .set("Cookie", newerCookie)
          .query({ code: "newer-code", state: "newer-state" });

        expect(replay.status).to.equal(BAD_REQUEST);
        expect(protectedAccess.status).to.equal(FOUND);
        expect(protectedAccess.headers.location).to.equal("/auth/signin");
        expect(newerCallback.status).to.equal(FOUND);
        expect(authServiceStub.exchangeAuthCode.calledThrice).to.be.true;
        expect(
          (await unrelatedAgent.get("/test/session")).body.isAuthenticated,
        ).to.be.true;
      });
    }

    it("uses the rotated session ID when creating the MSAL client for code exchange", async () => {
      const next = sinon.stub();
      const createStub = EntraService.create as unknown as sinon.SinonStub;
      createStub.resetHistory();
      const returnTo = "/cases/123?status=open#details";
      const sessionId = randomUUID();
      await storeFlow(sessionId, CALLBACK_STATE, returnTo);

      const req = createHandlerRequest({
        hostname: "localhost",
        query: QUERY_PARAMS,
        session: {
          regenerate: (callback: (error?: Error | null) => void): void => {
            req.sessionID = "new-session-id";
            req.session = {
              save: (saveCallback: (error?: Error | null) => void): void =>
                saveCallback(),
            } as Request["session"];
            callback();
          },
          save: (callback: (error?: Error | null) => void): void =>
            callback(),
        },
        sessionID: sessionId,
      });

      const res = {
        redirect: sinon.stub(),
        send: sinon.stub().returnsThis(),
        set: sinon.stub().returnsThis(),
        status: sinon.stub().returnsThis(),
      } as unknown as Response;

      await authCodeCallback(req, res, next);

      expect(createStub.calledOnceWithExactly({ sessionId: "new-session-id" }))
        .to.be.true;
      const redirect = res.redirect as sinon.SinonStub;
      expect(redirect.calledOnceWithExactly(returnTo)).to.be.true;
      expectAllowedLocalLocation(redirect.firstCall.args[0]);
      expect(next.called).to.be.false;
    });

    it("redirects to / when the saved callback destination is an auth path", async () => {
      const next = sinon.stub();
      const sessionId = randomUUID();
      await storeFlow(sessionId, CALLBACK_STATE, "/AUTH/code/callback");
      const req = createHandlerRequest({
        query: QUERY_PARAMS,
        session: {
          regenerate: (callback: (error?: Error | null) => void): void =>
            callback(),
          save: (callback: (error?: Error | null) => void): void =>
            callback(),
        },
        sessionID: sessionId,
      });
      const res = {
        redirect: sinon.stub(),
        send: sinon.stub().returnsThis(),
        set: sinon.stub().returnsThis(),
        status: sinon.stub().returnsThis(),
      } as unknown as Response;

      await authCodeCallback(req, res, next);

      const redirect = res.redirect as sinon.SinonStub;
      expect(redirect.calledOnceWithExactly("/")).to.be.true;
      expectAllowedLocalLocation(redirect.firstCall.args[0]);
      expect(next.called).to.be.false;
    });

    describe("session guards", () => {
      let app: express.Application;

      before(() => {
        app = createMockApp();
      });

      it("responds with 400 when session has no pending flow", async () => {
        const res = await request(app)
          .get("/auth/code/callback")
          .query(QUERY_PARAMS);

        expect(res.status).to.equal(BAD_REQUEST);
        expect(res.text).to.equal("Invalid or expired sign-in flow");
      });

      it("responds with 400 when state does not match the pending flow", async () => {
        const res = await request(app)
          .get("/auth/code/callback")
          .query({ code: "auth-code", state: "mismatched-state" });

        expect(res.status).to.equal(BAD_REQUEST);
        expect(res.text).to.equal("Invalid or expired sign-in flow");
      });
    });

    describe("relay behavior", () => {
      const SESSION_SECRET = process.env.SESSION_SECRET as string;
      const VALID_EPHEMERAL_TARGET =
        "https://mem-257-xyz-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";

      it("rejects a relay envelope without expiry before local flow consumption", async () => {
        const state = Buffer.from(
          JSON.stringify({
            nonce: "relay-nonce",
            signature: "signature",
            target: VALID_EPHEMERAL_TARGET,
          }),
        ).toString("base64");
        const sessionId = randomUUID();
        await storeFlow(sessionId, state);
        const req = {
          hostname: "localhost",
          query: { code: "auth-code", state },
          sessionID: sessionId,
        } as unknown as Request;
        const status = sinon.stub().returnsThis();
        const send = sinon.stub().returnsThis();
        const res = {
          redirect: sinon.stub(),
          send,
          set: sinon.stub().returnsThis(),
          status,
        } as unknown as Response;

        await authCodeCallback(
          req,
          res,
          sinon.stub() as unknown as NextFunction,
        );
        const flow = await getAuthFlowStore().consume(sessionId, state);

        expect(status.calledOnceWithExactly(BAD_REQUEST)).to.be.true;
        expect(send.calledOnceWithExactly("Invalid relay target")).to.be.true;
        expect(authServiceStub.exchangeAuthCode.called).to.be.false;
        expect(flow.error).to.be.undefined;
        if (flow.error) return;
        expect(flow.value?.authState).to.equal(state);
      });

      it("redirects to the relay target when state contains a valid signed target for a different host", async () => {
        const state = createRelayState(
          "nonce-id",
          VALID_EPHEMERAL_TARGET,
          RELAY_EXPIRY,
          SESSION_SECRET,
        );

        const res = await request(mockApp)
          .get("/auth/code/callback")
          .query({ code: "auth-code", state });

        expect(res.status).to.equal(FOUND);
        const relayLocation = new URL(res.headers.location);
        expect(relayLocation.origin).to.equal(
          new URL(VALID_EPHEMERAL_TARGET).origin,
        );
        expect(relayLocation.pathname).to.equal("/auth/code/callback");
        expect(res.headers.location).to.include(
          `${VALID_EPHEMERAL_TARGET}/auth/code/callback`,
        );
        expect(res.headers.location).to.include("code=auth-code");
        expect(res.headers.location).to.include(
          `state=${encodeURIComponent(state)}`,
        );
        expect(res.headers["cache-control"]).to.equal("no-store");
        expect(authServiceStub.exchangeAuthCode.called).to.be.false;
      });

      it("forwards a success callback before the origin consumes its flow", async () => {
        const state = createRelayState(
          "two-hop-success",
          VALID_EPHEMERAL_TARGET,
          RELAY_EXPIRY,
          SESSION_SECRET,
        );
        const originSessionId = randomUUID();
        const intermediarySessionId = randomUUID();
        await storeFlow(originSessionId, state);
        const callbackQuery = { code: "auth-code", state };
        const intermediaryRedirect = sinon.stub();
        const intermediaryRes = {
          redirect: intermediaryRedirect,
          send: sinon.stub().returnsThis(),
          set: sinon.stub().returnsThis(),
          status: sinon.stub().returnsThis(),
        } as unknown as Response;

        await authCodeCallback(
          {
            hostname: "laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk",
            query: callbackQuery,
            sessionID: intermediarySessionId,
          } as unknown as Request,
          intermediaryRes,
          sinon.stub() as unknown as NextFunction,
        );

        const relayLocation = new URL(intermediaryRedirect.firstCall.args[0]);
        expect(relayLocation.origin).to.equal(VALID_EPHEMERAL_TARGET);
        expect([...relayLocation.searchParams.keys()].sort()).to.deep.equal([
          "code",
          "state",
        ]);
        expect(
          getValue(
            await getAuthFlowStore().consume(intermediarySessionId, state),
          ),
        ).to.be.undefined;
        expect(authServiceStub.exchangeAuthCode.called).to.be.false;

        const originRedirect = sinon.stub();
        const originReq = createHandlerRequest({
          hostname: new URL(VALID_EPHEMERAL_TARGET).hostname,
          query: callbackQuery,
          sessionID: originSessionId,
          session: {
            regenerate: (callback: (error?: Error | null) => void): void =>
              callback(),
            save: (callback: (error?: Error | null) => void): void => callback(),
          },
        });
        const originRes = {
          clearCookie: sinon.stub(),
          redirect: originRedirect,
          send: sinon.stub().returnsThis(),
          set: sinon.stub().returnsThis(),
          status: sinon.stub().returnsThis(),
        } as unknown as Response;
        await authCodeCallback(
          originReq,
          originRes,
          sinon.stub() as unknown as NextFunction,
        );

        expect(originRedirect.calledOnceWithExactly("/")).to.be.true;
        expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
      });

      it("forwards callbacks between independent HTTP apps and consumes only at origin", async () => {
        const origin = createMockApp();
        const intermediary = createMockApp();
        origin.locals.authFlowStore = createAuthFlowStore();
        intermediary.locals.authFlowStore = createAuthFlowStore();
        const target = "https://mem-257-xyz-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";
        const targetHost = new URL(target).hostname;
        const state = createRelayState(
          "two-hop-http-nonce",
          target,
          Date.now() + MINUTE,
          SESSION_SECRET,
        );
        authServiceStub.initiateAuthCodeFlow.resolves(
          success({
            authCodeUrl: "https://login.example/authorize",
            authCodeRequest: {},
            authState: state,
            returnTo: "/cases/123",
          }),
        );

        const originAgent = request.agent(origin);
        const signin = await originAgent.get("/auth/signin");
        const intermediaryCallback = await request(intermediary)
          .get("/auth/code/callback")
          .set("Host", "laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk")
          .query({ code: "auth-code", state });
        const originCallback = await originAgent
          .get("/auth/code/callback")
          .set("Host", targetHost)
          .query({ code: "auth-code", state });
        const replay = await request(origin)
          .get("/auth/code/callback")
          .set("Host", targetHost)
          .set("Cookie", getSetCookieHeaders(signin.headers["set-cookie"])[0].split(";", 1)[0])
          .query({ code: "auth-code", state });

        expect(signin.status).to.equal(FOUND);
        expect(intermediaryCallback.status).to.equal(FOUND);
        const forwarded = new URL(intermediaryCallback.headers.location);
        expect(forwarded.origin).to.equal(target);
        expect([...forwarded.searchParams.keys()].sort()).to.deep.equal([
          "code",
          "state",
        ]);
        expect(originCallback.status).to.equal(FOUND);
        expect(originCallback.headers.location).to.equal("/cases/123");
        expect(replay.status).to.equal(BAD_REQUEST);
        expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
      });

      it("rejects tampered and expired relay deadlines without consuming origin state", async () => {
        const app = createMockApp();
        const target = "https://mem-257-xyz-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";
        const expiry = Date.now() + MINUTE;
        const state = createRelayState("deadline-nonce", target, expiry, SESSION_SECRET);
        authServiceStub.initiateAuthCodeFlow.resolves(
          success({
            authCodeUrl: "https://login.example/authorize",
            authCodeRequest: {},
            authState: state,
            returnTo: "/",
          }),
        );
        const agent = request.agent(app);
        const signin = await agent.get("/auth/signin");
        const tampered = JSON.parse(
          Buffer.from(state, "base64").toString("utf8"),
        ) as { expiresAt: number; nonce: string; signature: string; target: string };
        tampered.expiresAt += 1;
        const tamperedState = Buffer.from(JSON.stringify(tampered)).toString("base64");
        const invalid = await agent
          .get("/auth/code/callback")
          .set("Host", new URL(target).hostname)
          .query({ code: "auth-code", state: tamperedState });
        const expiredState = createRelayState(
          "expired-nonce",
          target,
          Date.now() - 1,
          SESSION_SECRET,
        );
        const expired = await agent
          .get("/auth/code/callback")
          .set("Host", new URL(target).hostname)
          .query({ code: "auth-code", state: expiredState });
        const matching = await agent
          .get("/auth/code/callback")
          .set("Host", new URL(target).hostname)
          .query({ code: "auth-code", state });

        expect(signin.status).to.equal(FOUND);
        expect(invalid.status).to.equal(BAD_REQUEST);
        expect(invalid.text).to.equal("Invalid relay target");
        expect(expired.text).to.equal("Invalid relay target");
        expect(matching.status).to.equal(FOUND);
        expect(expired.status).to.equal(BAD_REQUEST);
        expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
      });

      it("forwards provider errors between independent HTTP apps without exchanging a code", async () => {
        const origin = createMockApp();
        const intermediary = createMockApp();
        origin.locals.authFlowStore = createAuthFlowStore();
        intermediary.locals.authFlowStore = createAuthFlowStore();
        const target = "https://mem-257-xyz-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";
        const state = createRelayState(
          "two-hop-error-http",
          target,
          Date.now() + MINUTE,
          SESSION_SECRET,
        );
        authServiceStub.initiateAuthCodeFlow.resolves(
          success({
            authCodeUrl: "https://login.example/authorize",
            authCodeRequest: {},
            authState: state,
            returnTo: "/",
          }),
        );
        const originAgent = request.agent(origin);
        await originAgent.get("/auth/signin");

        const intermediaryResponse = await request(intermediary)
          .get("/auth/code/callback")
          .set("Host", "laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk")
          .query({
            error: "access_denied",
            error_description: "do not forward this provider detail",
            state,
          });
        const forwarded = new URL(intermediaryResponse.headers.location);
        const originResponse = await originAgent
          .get("/auth/code/callback")
          .set("Host", new URL(target).hostname)
          .query({
            error: forwarded.searchParams.get("error"),
            state: forwarded.searchParams.get("state"),
          });
        const replay = await originAgent
          .get("/auth/code/callback")
          .set("Host", new URL(target).hostname)
          .query({ error: "access_denied", state });

        expect(intermediaryResponse.status).to.equal(FOUND);
        expect([...forwarded.searchParams.keys()].sort()).to.deep.equal([
          "error",
          "state",
        ]);
        expect(forwarded.searchParams.has("error_description")).to.be.false;
        expect(originResponse.status).to.equal(BAD_REQUEST);
        expect(originResponse.text).to.equal("Entra sign-in failed");
        expect(replay.status).to.equal(BAD_REQUEST);
        expect(authServiceStub.exchangeAuthCode.called).to.be.false;
      });

      it("forwards provider errors without descriptions and consumes them only at origin", async () => {
        const state = createRelayState(
          "two-hop-error",
          VALID_EPHEMERAL_TARGET,
          RELAY_EXPIRY,
          SESSION_SECRET,
        );
        const originSessionId = randomUUID();
        const intermediarySessionId = randomUUID();
        await storeFlow(originSessionId, state);
        const callbackQuery = {
          error: "access_denied",
          error_description: "provider detail must not be forwarded",
          state,
        };
        const intermediaryRedirect = sinon.stub();
        const intermediaryRes = {
          redirect: intermediaryRedirect,
          send: sinon.stub().returnsThis(),
          set: sinon.stub().returnsThis(),
          status: sinon.stub().returnsThis(),
        } as unknown as Response;

        await authCodeCallback(
          {
            hostname: "laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk",
            query: callbackQuery,
            sessionID: intermediarySessionId,
          } as unknown as Request,
          intermediaryRes,
          sinon.stub() as unknown as NextFunction,
        );

        const relayLocation = new URL(intermediaryRedirect.firstCall.args[0]);
        expect([...relayLocation.searchParams.keys()].sort()).to.deep.equal([
          "error",
          "state",
        ]);
        expect(relayLocation.searchParams.has("error_description")).to.be.false;
        expect(authServiceStub.exchangeAuthCode.called).to.be.false;

        const originStatus = sinon.stub().returnsThis();
        const originSend = sinon.stub().returnsThis();
        const originRes = {
          clearCookie: sinon.stub(),
          redirect: sinon.stub(),
          send: originSend,
          set: sinon.stub().returnsThis(),
          status: originStatus,
          type: sinon.stub().returnsThis(),
        } as unknown as Response;
        await authCodeCallback(
          createHandlerRequest({
            hostname: new URL(VALID_EPHEMERAL_TARGET).hostname,
            query: callbackQuery,
            sessionID: originSessionId,
          }),
          originRes,
          sinon.stub() as unknown as NextFunction,
        );

        expect(originStatus.calledOnceWithExactly(BAD_REQUEST)).to.be.true;
        expect(originSend.calledOnceWithExactly("Entra sign-in failed")).to.be
          .true;
        expect(authServiceStub.exchangeAuthCode.called).to.be.false;
        expect(
          getValue(await getAuthFlowStore().consume(originSessionId, state)),
        ).to.be.undefined;
      });

      it("responds with 400 when the relay signature is invalid", async () => {
        const state = createRelayState(
          "nonce-id",
          VALID_EPHEMERAL_TARGET,
          RELAY_EXPIRY,
          "wrong-secret",
        );

        const res = await request(mockApp)
          .get("/auth/code/callback")
          .query({ code: "auth-code", state });

        expect(res.status).to.equal(BAD_REQUEST);
        expect(res.text).to.equal("Invalid relay target");
      });

      it("responds with 400 when the relay target is not in the allowlist", async () => {
        const state = createRelayState(
          "nonce-id",
          "https://invalid.com",
          RELAY_EXPIRY,
          SESSION_SECRET,
        );

        const res = await request(mockApp)
          .get("/auth/code/callback")
          .query({ code: "auth-code", state });

        expect(res.status).to.equal(BAD_REQUEST);
        expect(res.text).to.equal("Invalid relay target");
      });

      it("processes the callback normally when the relay target matches the current host", async () => {
        const ephemeralHost = new URL(VALID_EPHEMERAL_TARGET).hostname;
        const state = createRelayState(
          "nonce-id",
          `https://${ephemeralHost}`,
          RELAY_EXPIRY,
          SESSION_SECRET,
        );
        const sessionId = randomUUID();
        await storeFlow(sessionId, state);

        const req = createHandlerRequest({
          hostname: ephemeralHost,
          query: { code: "auth-code", state },
          session: {
            regenerate: (callback: (error?: Error | null) => void): void =>
              callback(),
            save: (callback: (error?: Error | null) => void): void => callback(),
          },
          sessionID: sessionId,
        });
        const res = {
          clearCookie: sinon.stub(),
          redirect: sinon.stub(),
          send: sinon.stub().returnsThis(),
          set: sinon.stub().returnsThis(),
          status: sinon.stub().returnsThis(),
        } as unknown as Response;
        await authCodeCallback(req, res, sinon.stub() as unknown as NextFunction);

        expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
        const redirect = res.redirect as sinon.SinonStub;
        expect(redirect.calledOnceWithExactly("/")).to.be.true;
        expectAllowedLocalLocation(redirect.firstCall.args[0]);
      });

      it("processes the callback normally when state has no relay target", async () => {
        const agent = request.agent(mockApp);
        await startSignIn(agent);
        const res = await agent.get("/auth/code/callback").query(QUERY_PARAMS);

        expect(authServiceStub.exchangeAuthCode.calledOnce).to.be.true;
        expect(res.status).to.equal(FOUND);
        expect(res.headers.location).to.equal("/");
        expectAllowedLocalLocation(res.headers.location);
      });
    });
  });

  describe("signOut()", () => {
    it("redirects to /", async () => {
      const res = await request(mockApp).get("/auth/signout");

      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal("/");
      expectAllowedLocalLocation(res.headers.location);
    });

    it("destroys the session and clears the cookie before redirecting", async () => {
      const agent = request.agent(mockApp);
      await agent.get("/auth/signin"); // establishes a session cookie

      const res = await agent.get("/auth/signout");

      expect(res.status).to.equal(FOUND);
      expectAllowedLocalLocation(res.headers.location);
      const rawCookies = res.headers["set-cookie"];
      const cookies: string[] = Array.isArray(rawCookies)
        ? rawCookies
        : [rawCookies].filter(Boolean);
      expect(
        cookies.some((cookie) => cookie.includes("Expires=Thu, 01 Jan 1970")),
      ).to.be.true;
    });

    it("deletes the session MSAL cache key from Redis when Redis is enabled", async () => {
      const redisClient = redis.getRedisClient();
      const del = sinon.stub(redisClient, "del").resolves(1);
      sinon.stub(config.redis, "enabled").value(true);

      const agent = request.agent(mockApp);
      await agent.get("/auth/signin");
      const res = await agent.get("/auth/signout");

      expect(res.status).to.equal(FOUND);
      expectAllowedLocalLocation(res.headers.location);
      expect(del.calledOnce).to.be.true;
      const [key] = del.firstCall.args as [string];
      expect(key.startsWith("msal:")).to.be.true;
    });
  });
});
