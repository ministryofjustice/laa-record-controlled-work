import {
  ConfidentialClientApplication,
  CryptoProvider,
} from "@azure/msal-node";
import { EntraService } from "#/auth/entra.service.js";
import type {
  AuthCodeFlowState,
  TokenExchangeResult,
} from "#/auth/auth.types.js";
import { expect } from "chai";
import sinon from "sinon";
import { authRequestDefaults } from "#/auth/auth.config.js";
import { parseRelayState, verifyRelayState } from "#/auth/auth.relay.js";
import { Success } from "#/lib/either.js";
import {
  MsalError,
  PkceGenerationError,
  TokenAcquisitionError,
  TokenRefreshError,
} from "#/auth/auth.errors.js";

describe("EntraService", () => {
  let msalStub: Partial<ConfidentialClientApplication>;
  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth/";
  let service: EntraService;
  const AUTH_CODE = "auth-code";
  const CHALLENGE = "test-challenge";
  const VERIFIER = "test-verifier";
  const ID_TOKEN = "id-token";
  const ACCESS_TOKEN = "access-token";
  const ACCOUNT = { username: "user" };
  const TOKEN_EXPIRY = new Date(Date.now() + 3600 * 1000);
  const SESSION_SECRET = process.env.SESSION_SECRET as string;
  const REDIRECT_URI_HOSTNAME = new URL(authRequestDefaults.redirectUri)
    .hostname;
  const EPHEMERAL_HOSTNAME =
    "el-257-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";

  beforeEach(() => {
    msalStub = {
      getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL),
    };

    service = EntraService.create(
      REDIRECT_URI_HOSTNAME,
      undefined,
      msalStub as ConfidentialClientApplication,
    );

    sinon.stub(CryptoProvider.prototype, "generatePkceCodes").resolves({
      verifier: VERIFIER,
      challenge: CHALLENGE,
    });
  });

  afterEach(() => sinon.restore());

  describe("create() factory method", () => {
    it("should use provided msalClient and ignore sessionId", () => {
      const customMsalStub =
        sinon.stub() as unknown as ConfidentialClientApplication;
      const result = EntraService.create(
        REDIRECT_URI_HOSTNAME,
        "session-123",
        customMsalStub,
      );

      expect(result.msalClient).to.equal(customMsalStub);
    });

    it("should return an EntraService instance with default client when no msalClient provided", () => {
      const result = EntraService.create(REDIRECT_URI_HOSTNAME);

      expect(result).to.be.an.instanceOf(EntraService);
      expect(result.msalClient).to.be.an.instanceOf(
        ConfidentialClientApplication,
      );
    });

    it("should use provided msalClient when both sessionId and msalClient are provided", () => {
      const customMsalStub =
        sinon.stub() as unknown as ConfidentialClientApplication;
      const result = EntraService.create(
        REDIRECT_URI_HOSTNAME,
        undefined,
        customMsalStub,
      );

      expect(result.msalClient).to.equal(customMsalStub);
    });
  });

  describe("initiateAuthCodeFlow()", () => {
    it("returns a success with the URL from the MSAL client", async () => {
      const result =
        (await service.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      expect(result.error).to.be.undefined;
      expect(result.value.authCodeUrl).to.equal(AUTH_CODE_URL);
    });

    it("returns a random authState and passes it as the state parameter", async () => {
      const result =
        (await service.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      expect(result.value.authState)
        .to.be.a("string")
        .with.length.greaterThan(0);
      const [requestArg] = (msalStub.getAuthCodeUrl as sinon.SinonStub).args[0];
      expect(requestArg.state).to.equal(result.value.authState);
    });

    it("defaults returnTo to / when no returnTo is provided", async () => {
      const result =
        (await service.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/");
    });

    it("preserves a valid returnTo path", async () => {
      const result = (await service.initiateAuthCodeFlow(
        "/case/123",
      )) as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/case/123");
    });

    it("preserves returnTo of /", async () => {
      const result = (await service.initiateAuthCodeFlow(
        "/",
      )) as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/");
    });

    it("falls back to / when returnTo could redirect to an external site", async () => {
      const result = (await service.initiateAuthCodeFlow(
        "//external.com",
      )) as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/");
    });

    it("returns a MsalError failure when MSAL throws", async () => {
      (msalStub.getAuthCodeUrl as sinon.SinonStub).rejects(
        new Error("MSAL failure"),
      );
      const result = await service.initiateAuthCodeFlow();
      expect(result.error).to.exist;
      expect(result.error).to.be.an("error").and.to.be.instanceOf(MsalError);
      expect(result.error?.cause)
        .to.be.an("error")
        .and.to.have.property("message", "MSAL failure");
    });

    it("returns a PkceGenerationError failure when PKCE generation throws", async () => {
      (CryptoProvider.prototype.generatePkceCodes as sinon.SinonStub).rejects(
        new Error("PKCE failure"),
      );

      const result = await service.initiateAuthCodeFlow();

      expect(result.error)
        .to.be.an("error")
        .and.to.be.instanceOf(PkceGenerationError);
      expect(result.error?.cause)
        .to.be.an("error")
        .and.to.have.property("message", "PKCE failure");
    });

    it("creates a plain state when requestHostname matches the redirect URI hostname", async () => {
      const result =
        (await service.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      const parsed = parseRelayState(result.value.authState);
      expect(parsed).to.be.null;
    });

    it("creates a relay state with target and sig when requestHostname differs from redirect URI hostname", async () => {
      const ephemeralService = EntraService.create(
        EPHEMERAL_HOSTNAME,
        undefined,
        msalStub as ConfidentialClientApplication,
      );
      const result =
        (await ephemeralService.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      const parsed = parseRelayState(result.value.authState);
      expect(parsed).to.not.be.null;
      expect(parsed!.target).to.equal(`https://${EPHEMERAL_HOSTNAME}`);
      expect(verifyRelayState(parsed!, SESSION_SECRET)).to.be.true;
    });
  });

  describe("exchangeAuthCode()", () => {
    let authCodeRequest: {
      code: string;
      codeVerifier: string;
      scopes: string[];
      redirectUri: string;
    };

    beforeEach(() => {
      authCodeRequest = {
        code: "",
        codeVerifier: VERIFIER,
        scopes: [],
        redirectUri: "http://localhost/auth/code/callback",
      };
      msalStub.acquireTokenByCode = sinon
        .stub()
        .resolves({
          account: ACCOUNT,
          idToken: ID_TOKEN,
          accessToken: ACCESS_TOKEN,
          expiresOn: TOKEN_EXPIRY,
        });
      msalStub.getTokenCache = sinon
        .stub()
        .returns({ serialize: sinon.stub().returns("{}") });
    });

    it("returns tokenCache from the serialized MSAL cache", async () => {
      const result = (await service.exchangeAuthCode(
        AUTH_CODE,
        authCodeRequest,
      )) as Success<TokenExchangeResult>;
      expect(result.value.tokenCache).to.equal("{}");
    });

    it("serializes the token cache after acquiring the token", async () => {
      const serializeStub = sinon.stub().returns("{}");
      (msalStub.getTokenCache as sinon.SinonStub).returns({
        serialize: serializeStub,
      });

      await service.exchangeAuthCode(AUTH_CODE, authCodeRequest);

      const acquireCallOrder = (msalStub.acquireTokenByCode as sinon.SinonStub)
        .callCount;
      const serializeCallOrder = serializeStub.callCount;
      expect(acquireCallOrder).to.equal(1);
      expect(serializeCallOrder).to.equal(1);
      expect(
        (msalStub.acquireTokenByCode as sinon.SinonStub).calledBefore(
          serializeStub,
        ),
      ).to.be.true;
    });

    it("returns account and idToken", async () => {
      const result = (await service.exchangeAuthCode(
        AUTH_CODE,
        authCodeRequest,
      )) as Success<TokenExchangeResult>;
      expect(result.value.account).to.deep.equal(ACCOUNT);
      expect(result.value.idToken).to.equal(ID_TOKEN);
    });

    it("returns accessToken from the MSAL response", async () => {
      const result = (await service.exchangeAuthCode(
        AUTH_CODE,
        authCodeRequest,
      )) as Success<TokenExchangeResult>;
      expect(result.value.accessToken).to.equal(ACCESS_TOKEN);
    });

    it("returns tokenExpiry as a Unix ms timestamp", async () => {
      const result = (await service.exchangeAuthCode(
        AUTH_CODE,
        authCodeRequest,
      )) as Success<TokenExchangeResult>;
      expect(result.value.tokenExpiry).to.equal(TOKEN_EXPIRY.getTime());
    });

    it("returns undefined tokenExpiry when MSAL returns null expiresOn", async () => {
      (msalStub.acquireTokenByCode as sinon.SinonStub).resolves({
        account: ACCOUNT,
        idToken: ID_TOKEN,
        accessToken: ACCESS_TOKEN,
        expiresOn: null,
      });
      const result = (await service.exchangeAuthCode(
        AUTH_CODE,
        authCodeRequest,
      )) as Success<TokenExchangeResult>;
      expect(result.value.tokenExpiry).to.be.undefined;
    });

    it("returns a TokenAcquisitionError failure when MSAL throws", async () => {
      sinon.stub(console, "error");

      const msalError = new Error("MSAL failure");
      (msalStub.acquireTokenByCode as sinon.SinonStub).rejects(msalError);

      const result = await service.exchangeAuthCode(AUTH_CODE, authCodeRequest);
      expect(result.error)
        .to.be.an("error")
        .and.to.be.instanceOf(TokenAcquisitionError);
    });
  });

  describe("acquireTokenSilent()", () => {
    beforeEach(() => {
      msalStub.acquireTokenSilent = sinon.stub().resolves({
        account: ACCOUNT,
        idToken: ID_TOKEN,
        accessToken: ACCESS_TOKEN,
        expiresOn: TOKEN_EXPIRY,
      });
    });

    it("returns a refreshed access token on success", async () => {
      const result = (await service.acquireTokenSilent(ACCOUNT as any)) as Success<TokenExchangeResult>;
      expect(result.error).to.be.undefined;
      expect(result.value.accessToken).to.equal(ACCESS_TOKEN);
    });

    it("returns the account and idToken", async () => {
      const result = (await service.acquireTokenSilent(ACCOUNT as any)) as Success<TokenExchangeResult>;
      expect(result.value.account).to.deep.equal(ACCOUNT);
      expect(result.value.idToken).to.equal(ID_TOKEN);
    });

    it("returns tokenExpiry as a Unix ms timestamp", async () => {
      const result = (await service.acquireTokenSilent(ACCOUNT as any)) as Success<TokenExchangeResult>;
      expect(result.value.tokenExpiry).to.equal(TOKEN_EXPIRY.getTime());
    });

    it("does not include tokenCache in the result (handled by ICachePlugin)", async () => {
      const result = (await service.acquireTokenSilent(ACCOUNT as any)) as Success<TokenExchangeResult>;
      expect(result.value.tokenCache).to.be.undefined;
    });

    it("passes the correct scopes to acquireTokenSilent", async () => {
      await service.acquireTokenSilent(ACCOUNT as any);
      const [requestArg] = (msalStub.acquireTokenSilent as sinon.SinonStub)
        .args[0];
      expect(requestArg.scopes).to.include("openid");
      expect(requestArg.scopes).to.include("profile");
      expect(requestArg.scopes).to.include("offline_access");
    });

    it("returns a TokenRefreshError failure when acquireTokenSilent throws", async () => {
      (msalStub.acquireTokenSilent as sinon.SinonStub).rejects(
        new Error("silent failure"),
      );

      const result = await service.acquireTokenSilent(ACCOUNT as any);
      expect(result.error)
        .to.be.an("error")
        .and.to.be.instanceOf(TokenRefreshError);
      expect(result.error?.cause).to.have.property("message", "silent failure");
    });
  });
});

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
  const REDIRECT_URI_HOSTNAME = new URL(authRequestDefaults.redirectUri)
    .hostname;
  const EPHEMERAL_HOSTNAME =
    "el-257-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";

  beforeEach(() => {
    msalStub = {
      getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL),
    };

    service = EntraService.create(
      REDIRECT_URI_HOSTNAME,
      undefined,
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
      const result =
        (await service.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      expect(result.error).to.be.undefined;
      expect(result.value.authCodeUrl).to.equal(AUTH_CODE_URL);
    });

    it("returns a random authState and passes it as the state parameter", async () => {
      const result =
        (await service.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      expect(result.value.authState)
        .to.be.a("string")
        .with.length.greaterThan(0);
      const [requestArg] = (msalStub.getAuthCodeUrl as sinon.SinonStub).args[0];
      expect(requestArg.state).to.equal(result.value.authState);
    });

    it("defaults returnTo to / when no returnTo is provided", async () => {
      const result =
        (await service.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/");
    });

    it("preserves a valid returnTo path", async () => {
      const result = (await service.initiateAuthCodeFlow(
        "/case/123",
      )) as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/case/123");
    });

    it("preserves returnTo of /", async () => {
      const result = (await service.initiateAuthCodeFlow(
        "/",
      )) as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/");
    });

    it("falls back to / when returnTo could redirect to an external site", async () => {
      const result = (await service.initiateAuthCodeFlow(
        "//external.com",
      )) as Success<AuthCodeFlowState>;
      expect(result.value.returnTo).to.equal("/");
    });

    it("returns a MsalError failure when MSAL throws", async () => {
      (msalStub.getAuthCodeUrl as sinon.SinonStub).rejects(
        new Error("MSAL failure"),
      );
      const result = await service.initiateAuthCodeFlow();
      expect(result.error).to.exist;
      expect(result.error).to.be.an("error").and.to.be.instanceOf(MsalError);
      expect(result.error?.cause)
        .to.be.an("error")
        .and.to.have.property("message", "MSAL failure");
    });

    it("returns a PkceGenerationError failure when PKCE generation throws", async () => {
      (CryptoProvider.prototype.generatePkceCodes as sinon.SinonStub).rejects(
        new Error("PKCE failure"),
      );

      const result = await service.initiateAuthCodeFlow();

      expect(result.error)
        .to.be.an("error")
        .and.to.be.instanceOf(PkceGenerationError);
      expect(result.error?.cause)
        .to.be.an("error")
        .and.to.have.property("message", "PKCE failure");
    });

    it("creates a plain state when requestHostname matches the redirect URI hostname", async () => {
      const result =
        (await service.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      const parsed = parseRelayState(result.value.authState);
      expect(parsed).to.be.null;
    });

    it("creates a relay state with target and sig when requestHostname differs from redirect URI hostname", async () => {
      const ephemeralService = EntraService.create(
        EPHEMERAL_HOSTNAME,
        undefined,
        msalStub as ConfidentialClientApplication,
      );
      const result =
        (await ephemeralService.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      const parsed = parseRelayState(result.value.authState);
      expect(parsed).to.not.be.null;
      expect(parsed!.target).to.equal(`https://${EPHEMERAL_HOSTNAME}`);
      expect(verifyRelayState(parsed!, SESSION_SECRET)).to.be.true;
    });
  });

  describe("exchangeAuthCode()", () => {
    let authCodeRequest: {
      code: string;
      codeVerifier: string;
      scopes: string[];
      redirectUri: string;
    };

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

    it("returns tokenCache from the serialized MSAL cache", async () => {
      const result = (await service.exchangeAuthCode(
        AUTH_CODE,
        authCodeRequest,
      )) as Success<TokenExchangeResult>;
      expect(result.value.tokenCache).to.equal("{}");
    });

    it("returns account and idToken", async () => {
      const result = (await service.exchangeAuthCode(
        AUTH_CODE,
        authCodeRequest,
      )) as Success<TokenExchangeResult>;
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
        .to.be.an("error")
        .and.to.be.instanceOf(TokenAcquisitionError);
    });
  });
});
