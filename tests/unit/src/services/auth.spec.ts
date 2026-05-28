import {
  ConfidentialClientApplication,
  CryptoProvider,
} from "@azure/msal-node";
import { EntraService } from "#/auth/auth.service.js";
import type { AuthCodeFlowState, TokenExchangeResult } from "#/auth/auth.types.js";
import { expect } from "chai";
import sinon from "sinon";
import { authRequestDefaults } from "#/auth/auth.config.js";
import { parseRelayState, verifyRelayState } from "#/auth/auth.relay.js";
import { Success } from "#/lib/either.js";
import { MsalError, TokenAcquisitionError } from "#/auth/auth.errors.js";

describe("EntraService", () => {
  let msalStub: Partial<ConfidentialClientApplication>;
  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth/";
  let service: EntraService;
  const NONCE = "test-nonce";
  const AUTH_CODE = "auth-code";
  const CHALLENGE_METHOD = "S256";
  const CHALLENGE = "test-challenge";
  const VERIFIER = "test-verifier";
  const ID_TOKEN = "id-token";
  const ACCOUNT = { username: "user" };
  const SUCCESS_REDIRECT = "/test/success";
  const SESSION_SECRET = process.env.SESSION_SECRET as string;
  const REDIRECT_URI_HOSTNAME = new URL(authRequestDefaults.redirectUri).hostname;
  const EPHEMERAL_HOSTNAME = "el-257-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";

  beforeEach(() => {
    msalStub = {
      getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL),
    };

    service = EntraService.create(
      REDIRECT_URI_HOSTNAME,
      msalStub as ConfidentialClientApplication,
    );

    sinon.stub(CryptoProvider.prototype, "generatePkceCodes").resolves({
      verifier: VERIFIER,
      challenge: CHALLENGE,
    });
  });

  afterEach(() => sinon.restore());

  describe("initiateAuthCodeFlow()", () => {
    it("returns a success with the URL from the MSAL client", async () => {
      const result = await service.initiateAuthCodeFlow() as Success<AuthCodeFlowState>;
      expect(result.error).to.be.undefined;
      expect(result.value.authCodeUrl).to.equal(AUTH_CODE_URL);
    });

    it("returns PKCE codes", async () => {
      const result = await service.initiateAuthCodeFlow() as Success<AuthCodeFlowState>;
      expect(result.value.pkceCodes).to.exist;
      expect(result.value.pkceCodes.verifier).to.equal(VERIFIER);
      expect(result.value.pkceCodes.challenge).to.equal(CHALLENGE);
    });

    it("returns authCodeUrlRequest and authCodeRequest", async () => {
      const result = await service.initiateAuthCodeFlow() as Success<AuthCodeFlowState>;
      expect(result.value.authCodeUrlRequest).to.exist;
      expect(result.value.authCodeRequest).to.exist;
    });

    it("returns a random authState and passes it as the state parameter", async () => {
      const result = await service.initiateAuthCodeFlow() as Success<AuthCodeFlowState>;
      expect(result.value.authState).to.be.a("string").with.length.greaterThan(0);
      const [requestArg] = (msalStub.getAuthCodeUrl as sinon.SinonStub).args[0];
      expect(requestArg.state).to.equal(result.value.authState);
    });

    it("defaults returnTo to /landing when no returnTo is provided", async () => {
      const result = await service.initiateAuthCodeFlow() as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/landing");
    });

    it("preserves a valid returnTo path", async () => {
      const result = await service.initiateAuthCodeFlow("/case/123") as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/case/123");
    });

    it("falls back to /landing when returnTo is /", async () => {
      const result = await service.initiateAuthCodeFlow("/") as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/landing");
    });

    it("passes expected correct params to MSAL", async () => {
      await service.initiateAuthCodeFlow();
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
      const result = await service.initiateAuthCodeFlow();
      expect(result.error).to.exist;
      expect(result.error)
        .to.be.an("error")
        .and.to.be.instanceOf(MsalError)
      expect(result.error?.cause).to.be.an("error")
        .and.to.have.property("message", "MSAL failure")
    });

    it("creates a plain state when requestHostname matches the redirect URI hostname", async () => {
      const result = await service.initiateAuthCodeFlow() as Success<AuthCodeFlowState>;
      const parsed = parseRelayState(result.value.authState);
      expect(parsed).to.be.null;
    });

    it("creates a relay state with target and sig when requestHostname differs from redirect URI hostname", async () => {
      const ephemeralService = EntraService.create(
        EPHEMERAL_HOSTNAME,
        msalStub as ConfidentialClientApplication,
      );
      const result = await ephemeralService.initiateAuthCodeFlow() as Success<AuthCodeFlowState>;
      const parsed = parseRelayState(result.value.authState);
      expect(parsed).to.not.be.null;
      expect(parsed!.target).to.equal(`https://${EPHEMERAL_HOSTNAME}`);
      expect(verifyRelayState(parsed!, SESSION_SECRET)).to.be.true;
    });
  });

  describe("exchangeAuthCode()", () => {
    let authCodeRequest: { code: string; codeVerifier: string; scopes: string[]; redirectUri: string };

    beforeEach(() => {
      authCodeRequest = {
        code: "",
        codeVerifier: VERIFIER,
        scopes: [],
        redirectUri: "http://localhost/auth/code/callback",
      };
      msalStub.acquireTokenByCode = sinon
        .stub()
        .resolves({ account: ACCOUNT, idToken: ID_TOKEN });
      msalStub.getTokenCache = sinon
        .stub()
        .returns({ serialize: sinon.stub().returns("{}") });
    });

    it("calls acquireTokenByCode with authCodeRequest plus the code", async () => {
      await service.exchangeAuthCode(AUTH_CODE, authCodeRequest);
      const [requestArg] = (msalStub.acquireTokenByCode as sinon.SinonStub)
        .args[0];
      expect(requestArg.code).to.equal(AUTH_CODE);
      expect(requestArg.codeVerifier).to.equal(VERIFIER);
    });

    it("returns tokenCache from the serialized MSAL cache", async () => {
      const result = await service.exchangeAuthCode(AUTH_CODE, authCodeRequest) as Success<TokenExchangeResult>;
      expect(result.value.tokenCache).to.equal("{}");
    });

    it("returns account and idToken", async () => {
      const result = await service.exchangeAuthCode(AUTH_CODE, authCodeRequest) as Success<TokenExchangeResult>;
      expect(result.value.account).to.deep.equal(ACCOUNT);
      expect(result.value.idToken).to.equal(ID_TOKEN);
    });

    it("returns a TokenAcquisitionError failure when MSAL throws", async () => {
      // TODO remove stub once we remove console.error from the catch blocks in EntraService 
      sinon.stub(console, "error");

      const msalError = new Error("MSAL failure");
      (msalStub.acquireTokenByCode as sinon.SinonStub).rejects(msalError);

      const result = await service.exchangeAuthCode(AUTH_CODE, authCodeRequest);
      expect(result.error)
        .to.be.an('error')
        .and.to.be.instanceOf(TokenAcquisitionError)
    });
  });

});
