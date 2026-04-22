import {
  ConfidentialClientApplication,
  CryptoProvider,
} from "@azure/msal-node";
import { AuthService } from "#src/services/auth.js";
import config from "#config.js";
import { expect } from "chai";
import type { SessionData } from "express-session";
import sinon from "sinon";
import { authRequestDefaults } from "#src/config/auth.js";
import type { AuthError } from "#types/auth-types.js";

describe("AuthService", () => {
  let msalStub: Partial<ConfidentialClientApplication>;
  let session: SessionData;
  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth";
  let service: AuthService;
  const NONCE = "test-nonce";
  const requestBody = { code: "auth-code", state: NONCE };
  const CHALLENGE_METHOD = "S256";
  const CHALLENGE = "test-challenge";
  const VERIFIER = "test-verifier";
  const ID_TOKEN = "id-token";
  const ACCOUNT = { username: "user" };
  const SUCCESS_REDIRECT = "/test/success";

  beforeEach(() => {
    msalStub = {
      getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL),
    };

    session = {} as SessionData;
    service = AuthService.create(
      session,
      msalStub as ConfidentialClientApplication,
    );

    sinon.stub(CryptoProvider.prototype, "generatePkceCodes").resolves({
      verifier: VERIFIER,
      challenge: CHALLENGE,
    });
  });

  afterEach(() => sinon.restore());

  describe("getAuthCodeUrl()", () => {
    it("returns a success with the URL from the MSAL client", async () => {
      const result = await service.getAuthCodeUrl();
      expect(result.isSuccess()).to.be.true;
      expect(result.value).to.equal(AUTH_CODE_URL);
    });

    it("stores PKCE codes on session", async () => {
      await service.getAuthCodeUrl();
      expect(session.pkceCodes).to.exist;
      expect(session.pkceCodes!.verifier).to.equal(VERIFIER);
      expect(session.pkceCodes!.challenge).to.equal(CHALLENGE);
    });

    it("stores authCodeUrlRequest and authCodeRequest on session", async () => {
      await service.getAuthCodeUrl();
      expect(session.authCodeUrlRequest).to.exist;
      expect(session.authCodeRequest).to.exist;
    });

    it("stores a random nonce as session.authState and passes it as the state parameter", async () => {
      await service.getAuthCodeUrl();
      expect(session.authState).to.be.a("string").with.length.greaterThan(0);
      const [requestArg] = (msalStub.getAuthCodeUrl as sinon.SinonStub).args[0];
      expect(requestArg.state).to.equal(session.authState);
    });

    it("defaults session.returnTo to /landing when no returnTo is set", async () => {
      await service.getAuthCodeUrl();
      expect(session.returnTo).to.equal("/landing");
    });

    it("preserves a valid session.returnTo path", async () => {
      session.returnTo = "/case/123";
      await service.getAuthCodeUrl();
      expect(session.returnTo).to.equal("/case/123");
    });

    it("falls back to /landing when session.returnTo is /", async () => {
      session.returnTo = "/";
      await service.getAuthCodeUrl();
      expect(session.returnTo).to.equal("/landing");
    });

    it("passes expected correct params to MSAL", async () => {
      await service.getAuthCodeUrl();
      const [requestArg] = (msalStub.getAuthCodeUrl as sinon.SinonStub).args[0];
      expect(requestArg.responseMode).to.equal(
        authRequestDefaults.responseMode,
      );
      expect(requestArg.codeChallengeMethod).to.equal(CHALLENGE_METHOD);
      expect(requestArg.codeChallenge).to.equal(CHALLENGE);
      expect(requestArg.prompt).to.equal(authRequestDefaults.prompt);
      expect(requestArg.scopes).to.deep.equal(authRequestDefaults.scopes);
      expect(requestArg.redirectUri).to.equal(authRequestDefaults.redirectUri);
    });

    it("returns a MsalError failure when MSAL throws", async () => {
      (msalStub.getAuthCodeUrl as sinon.SinonStub).rejects(
        new Error("MSAL failure"),
      );
      const result = await service.getAuthCodeUrl();
      expect(result.isFailure()).to.be.true;
      expect((result.value as AuthError).type).to.equal("MsalError");
    });
  });

  describe("processAuthCodeCallback()", () => {
    beforeEach(() => {
      session.authState = NONCE;
      session.returnTo = SUCCESS_REDIRECT;
      session.authCodeRequest = {
        code: "",
        codeVerifier: VERIFIER,
        scopes: [],
        redirectUri: "http://localhost/auth/code/callback",
      };
      session.pkceCodes = {
        verifier: VERIFIER,
        challenge: CHALLENGE,
        challengeMethod: CHALLENGE_METHOD,
      };
      msalStub.acquireTokenByCode = sinon
        .stub()
        .resolves({ account: ACCOUNT, idToken: ID_TOKEN });
      msalStub.getTokenCache = sinon
        .stub()
        .returns({ serialize: sinon.stub().returns("{}") });
    });

    it("calls acquireTokenByCode with authCodeRequest from session plus the code", async () => {
      await service.processAuthCodeCallback(requestBody);
      const [requestArg] = (msalStub.acquireTokenByCode as sinon.SinonStub)
        .args[0];
      expect(requestArg.code).to.equal("auth-code");
      expect(requestArg.codeVerifier).to.equal(VERIFIER);
    });

    it("stores serialized token cache on session.tokenCache", async () => {
      await service.processAuthCodeCallback(requestBody);
      expect(session.tokenCache).to.equal("{}");
    });

    it("stores account and idToken on session", async () => {
      await service.processAuthCodeCallback(requestBody);

      expect(session.account).to.deep.equal(ACCOUNT);
      expect(session.idToken).to.equal(ID_TOKEN);
    });

    it("sets session.isAuthenticated to true", async () => {
      await service.processAuthCodeCallback(requestBody);
      expect(session.isAuthenticated).to.be.true;
    });

    it("returns a success with successRedirect from session.returnTo", async () => {
      const result = await service.processAuthCodeCallback(requestBody);
      expect(result.isSuccess()).to.be.true;
      expect(result.value).to.equal(SUCCESS_REDIRECT);
    });

    it("defaults successRedirect to /landing when session.returnTo is unset", async () => {
      delete session.returnTo;
      const result = await service.processAuthCodeCallback(requestBody);
      expect(result.isSuccess()).to.be.true;
      expect(result.value).to.equal("/landing");
    });

    it("clears session.authState after successful validation", async () => {
      await service.processAuthCodeCallback(requestBody);
      expect(session.authState).to.be.undefined;
    });

    it("returns a StateMismatch failure when state does not match session.authState", async () => {
      const result = await service.processAuthCodeCallback({
        ...requestBody,
        state: "wrong-nonce",
      });
      expect(result.isFailure()).to.be.true;
      expect((result.value as AuthError).type).to.equal("StateMismatch");
    });

    it("returns a StateMismatch failure when session.authState is missing", async () => {
      delete session.authState;
      const result = await service.processAuthCodeCallback(requestBody);
      expect(result.isFailure()).to.be.true;
      expect((result.value as AuthError).type).to.equal("StateMismatch");
    });

    it("returns a MissingAuthCodeRequest failure when authCodeRequest is missing from session", async () => {
      delete session.authCodeRequest;
      const result = await service.processAuthCodeCallback(requestBody);
      expect(result.isFailure()).to.be.true;
      expect((result.value as AuthError).type).to.equal(
        "MissingAuthCodeRequest",
      );
    });

    it("returns a TokenAcquisitionFailed failure when MSAL throws", async () => {
      const msalError = new Error("MSAL failure");
      (msalStub.acquireTokenByCode as sinon.SinonStub).rejects(msalError);

      const result = await service.processAuthCodeCallback(requestBody);
      expect(result.isFailure()).to.be.true;
      expect((result.value as AuthError).type).to.equal(
        "TokenAcquisitionFailed",
      );
    });
  });

  describe("getLogoutUrl()", () => {
    it("returns the Entra logout URL using config values", () => {
      const url = AuthService.getLogoutUrl();
      const params = new URLSearchParams({
        post_logout_redirect_uri: config.entra.postLogoutRedirectUri,
      });
      expect(url).to.equal(
        `${config.entra.authority}/oauth2/v2.0/logout?${params.toString()}`,
      );
    });

    it("includes id_token_hint when idToken is provided", () => {
      const url = AuthService.getLogoutUrl("test-id-token");
      expect(url).to.include("id_token_hint=test-id-token");
    });
  });
});
