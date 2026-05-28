import express from "express";
import request from "supertest";
import {
  BAD_REQUEST,
  FOUND,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#/lib/constants/httpStatus.js";
import sinon from "sinon";
import { EntraService } from "#/services/auth.js";
import { createRelayState } from "#/lib/auth.relay.js";
import { failure, success } from "#/lib/either.js";
import { expect } from "chai";
import { TokenAcquisitionError } from "#/lib/errors/auth.js";
import { createMockApp } from "../../utils.js";

const AUTH_CODE_URL = "https://login.microsoftonline.com/auth";
const SUCCESS_REDIRECT = "/case/123";

describe("Auth Handlers", () => {
  let authServiceStub: {
    getAuthCodeUrl: sinon.SinonStub;
    processAuthCodeCallback: sinon.SinonStub;
  };
  let mockApp: express.Application;

  before(() => {
    mockApp = createMockApp();

  });

  beforeEach(() => {
    // adding console stubs to hide purposely thrown errors and relay logs from terminal
    sinon.stub(console, "error");
    sinon.stub(console, "info");

    authServiceStub = {
      getAuthCodeUrl: sinon.stub().resolves(success(AUTH_CODE_URL)),
      processAuthCodeCallback: sinon.stub().resolves(success(SUCCESS_REDIRECT)),
    };

    sinon
      .stub(EntraService, "create")
      .returns(authServiceStub as unknown as EntraService);
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
    const QUERY_PARAMS = { code: "auth-code-abc", state: "encoded-state" };

    it("redirects to successRedirect on success", async () => {
      const res = await request(mockApp)
        .get("/auth/code/callback")
        .query(QUERY_PARAMS);

      expect(authServiceStub.processAuthCodeCallback.calledOnce).to.be.true;
      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal(SUCCESS_REDIRECT);
    });

    it("responds with 400 when auth request body doesn't match schema", async () => {
      const wrongQueryParams = { missing: "property" };

      const res = await request(mockApp)
        .get("/auth/code/callback")
        .query(wrongQueryParams);

      expect(authServiceStub.processAuthCodeCallback.called).to.be.false;
      expect(res.status).to.equal(BAD_REQUEST);
      expect(res.text).to.equal("Invalid redirect payload");
    });

    it("responds with 401 unathorised when TokenAcquisitionError is thrown", async () => {
      const error = new TokenAcquisitionError();
      authServiceStub.processAuthCodeCallback.resolves(failure(error));

      const res = await request(mockApp)
        .get("/auth/code/callback")
        .query(QUERY_PARAMS);

      expect(res.status).to.equal(UNAUTHORIZED);
      expect(res.text).to.equal("Token acquisition failed");
    });

    it("responds with 400 when other errors are thrown", async () => {
      const errorMessage = "Random Error";
      const error = new Error(errorMessage);
      authServiceStub.processAuthCodeCallback.resolves(failure(error));

      const res = await request(mockApp)
        .get("/auth/code/callback")
        .query(QUERY_PARAMS);

      expect(res.status).to.equal(BAD_REQUEST);
      expect(res.text).to.equal(errorMessage);
    });

    describe("relay behavior", () => {
      const SESSION_SECRET = process.env.SESSION_SECRET as string;
      const VALID_EPHEMERAL_TARGET =
        "https://mem-257-xyz-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";

      it("redirects to the relay target when state contains a valid signed target for a different host", async () => {
        const state = createRelayState("nonce-id", VALID_EPHEMERAL_TARGET, SESSION_SECRET);

        const res = await request(mockApp)
          .get("/auth/code/callback")
          .query({ code: "auth-code", state });

        expect(res.status).to.equal(FOUND);
        expect(res.headers.location).to.include(
          `${VALID_EPHEMERAL_TARGET}/auth/code/callback`,
        );
        expect(res.headers.location).to.include("code=auth-code");
        expect(res.headers.location).to.include(`state=${encodeURIComponent(state)}`);
        expect(res.headers["cache-control"]).to.equal("no-store");
        expect(authServiceStub.processAuthCodeCallback.called).to.be.false;
      });

      it("responds with 400 when the relay signature is invalid", async () => {
        const state = createRelayState("nonce-id", VALID_EPHEMERAL_TARGET, "wrong-secret");

        const res = await request(mockApp)
          .get("/auth/code/callback")
          .query({ code: "auth-code", state });

        expect(res.status).to.equal(BAD_REQUEST);
        expect(res.text).to.equal("Invalid relay target");
      });

      it("responds with 400 when the relay target is not in the allowlist", async () => {
        const state = createRelayState("nonce-id", "https://invalid.com", SESSION_SECRET);

        const res = await request(mockApp)
          .get("/auth/code/callback")
          .query({ code: "auth-code", state });

        expect(res.status).to.equal(BAD_REQUEST);
        expect(res.text).to.equal("Invalid relay target");
      });

      it("processes the callback normally when the relay target matches the current host", async () => {
        const ephemeralHost = new URL(VALID_EPHEMERAL_TARGET).hostname;
        const state = createRelayState("nonce-id", `https://${ephemeralHost}`, SESSION_SECRET);

        const res = await request(mockApp)
          .get("/auth/code/callback")
          .set("Host", ephemeralHost)
          .query({ code: "auth-code", state });

        expect(authServiceStub.processAuthCodeCallback.calledOnce).to.be.true;
        expect(res.status).to.equal(FOUND);
        expect(res.headers.location).to.equal(SUCCESS_REDIRECT);
      });

      it("processes the callback normally when state has no relay target", async () => {
        const res = await request(mockApp)
          .get("/auth/code/callback")
          .query(QUERY_PARAMS);

        expect(authServiceStub.processAuthCodeCallback.calledOnce).to.be.true;
        expect(res.status).to.equal(FOUND);
        expect(res.headers.location).to.equal(SUCCESS_REDIRECT);
      });
    });
  });

  describe("signOut()", () => {
    it("redirects to /", async () => {
      const res = await request(mockApp).get("/auth/signout");

      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal("/");
    });

    it("destroys the session and clears the cookie before redirecting", async () => {
      const agent = request.agent(mockApp);
      await agent.get("/auth/signin"); // establishes a session cookie

      const res = await agent.get("/auth/signout");

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