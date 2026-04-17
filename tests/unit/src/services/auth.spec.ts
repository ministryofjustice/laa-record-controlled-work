import {
  ConfidentialClientApplication,
  CryptoProvider,
} from "@azure/msal-node";
import { AuthService } from "#src/services/auth.js";
import config from "#config.js";
import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import type { SessionData } from "express-session";
import sinon from "sinon";

use(chaiAsPromised);

describe("AuthService", () => {
  let msalStub: Partial<ConfidentialClientApplication>;
  let session: SessionData;
  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth";
  let service: AuthService;

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
      verifier: "test-verifier",
      challenge: "test-challenge",
    });
  });

  afterEach(() => sinon.restore());

  describe("getAuthCodeUrl()", () => {
    it("returns a URL from the MSAL client", async () => {
      const url = await service.getAuthCodeUrl(session);
      expect(url).to.equal(AUTH_CODE_URL);
    });

    it("stores PKCE codes on session", async () => {
      await service.getAuthCodeUrl(session);
      expect(session.pkceCodes).to.exist;
      expect(session.pkceCodes!.verifier).to.equal("test-verifier");
      expect(session.pkceCodes!.challenge).to.equal("test-challenge");
    });

    it("stores authCodeUrlRequest and authCodeRequest on session", async () => {
      await service.getAuthCodeUrl(session);
      expect(session.authCodeUrlRequest).to.exist;
      expect(session.authCodeRequest).to.exist;
    });

    it("stores a random nonce as session.authState and passes it as the state parameter", async () => {
      await service.getAuthCodeUrl(session);
      expect(session.authState).to.be.a("string").with.length.greaterThan(0);
      const [requestArg] = (msalStub.getAuthCodeUrl as sinon.SinonStub).args[0];
      expect(requestArg.state).to.equal(session.authState);
    });

    it("defaults session.returnTo to /landing when no returnTo is set", async () => {
      await service.getAuthCodeUrl(session);
      expect(session.returnTo).to.equal("/landing");
    });

    it("preserves a valid session.returnTo path", async () => {
      session.returnTo = "/case/123";
      await service.getAuthCodeUrl(session);
      expect(session.returnTo).to.equal("/case/123");
    });

    it("falls back to /landing when session.returnTo is /", async () => {
      session.returnTo = "/";
      await service.getAuthCodeUrl(session);
      expect(session.returnTo).to.equal("/landing");
    });

    it('passes responseMode: "form_post" and PKCE challenge to MSAL', async () => {
      await service.getAuthCodeUrl(session);
      const [requestArg] = (msalStub.getAuthCodeUrl as sinon.SinonStub).args[0];
      expect(requestArg.responseMode).to.equal("form_post");
      expect(requestArg.codeChallenge).to.equal("test-challenge");
    });
  });

  describe("processAuthCodeCallback()", () => {
    const NONCE = "test-nonce";
    const requestBody = { code: "auth-code", state: NONCE };

    beforeEach(() => {
      session.authState = NONCE;
      session.returnTo = "/test/sucess";
      session.authCodeRequest = {
        code: "",
        codeVerifier: "test-verifier",
        scopes: [],
        redirectUri: "http://localhost/auth/code/callback",
      };
      session.pkceCodes = {
        verifier: "test-verifier",
        challenge: "test-challenge",
        challengeMethod: "S256",
      };
      msalStub.acquireTokenByCode = sinon
        .stub()
        .resolves({ account: { username: "user" }, idToken: "id-token" });
      msalStub.getTokenCache = sinon
        .stub()
        .returns({ serialize: sinon.stub().returns("{}") });
    });

    it("calls acquireTokenByCode with authCodeRequest from session plus the code", async () => {
      await service.processAuthCodeCallback(requestBody);
      const [requestArg] = (msalStub.acquireTokenByCode as sinon.SinonStub)
        .args[0];
      expect(requestArg.code).to.equal("auth-code");
      expect(requestArg.codeVerifier).to.equal("test-verifier");
    });

    it("stores serialized token cache on session.tokenCache", async () => {
      await service.processAuthCodeCallback(requestBody);

      expect(session.tokenCache).to.equal("{}");
    });

    it("stores account and idToken on session", async () => {
      await service.processAuthCodeCallback(requestBody);

      expect(session.account).to.deep.equal({ username: "user" });
      expect(session.idToken).to.equal("id-token");
    });

    it("sets session.isAuthenticated to true", async () => {
      await service.processAuthCodeCallback(requestBody);

      expect(session.isAuthenticated).to.be.true;
    });

    it("returns successRedirect from session.returnTo", async () => {
      const result = await service.processAuthCodeCallback(requestBody);
      expect(result).to.deep.equal({ successRedirect: "/test/sucess" });
    });

    it("defaults successRedirect to /landing when session.returnTo is unset", async () => {
      delete session.returnTo;
      const result = await service.processAuthCodeCallback(requestBody);
      expect(result).to.deep.equal({ successRedirect: "/landing" });
    });

    it("clears session.authState after successful validation", async () => {
      await service.processAuthCodeCallback(requestBody);
      expect(session.authState).to.be.undefined;
    });

    it("throws when state does not match session.authState", async () => {
      await expect(
        service.processAuthCodeCallback({
          ...requestBody,
          state: "wrong-nonce",
        }),
      ).to.be.rejectedWith("State mismatch: possible CSRF attack");
    });

    it("throws when session.authState is missing", async () => {
      delete session.authState;
      await expect(
        service.processAuthCodeCallback(requestBody),
      ).to.be.rejectedWith("State mismatch: possible CSRF attack");
    });

    it("throws when authCodeRequest is missing from session", async () => {
      delete session.authCodeRequest;

      await expect(
        service.processAuthCodeCallback(requestBody),
      ).to.be.rejectedWith("Missing auth code request in session");
    });

    it("propagates MSAL errors", async () => {
      const msalError = new Error("MSAL failure");
      (msalStub.acquireTokenByCode as sinon.SinonStub).rejects(msalError);

      await expect(
        service.processAuthCodeCallback(requestBody),
      ).to.be.rejectedWith(msalError);
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
