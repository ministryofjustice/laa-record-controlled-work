import {
  ConfidentialClientApplication,
  CryptoProvider,
  InteractionRequiredAuthError,
  type AccountInfo,
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
  NotAuthenticatedError,
  PkceGenerationError,
  TokenAcquisitionError,
  TokenRefreshError,
} from "#/auth/auth.errors.js";

describe("EntraService", () => {
  let msalStub: Partial<ConfidentialClientApplication>;
  let tokenCacheStub: { getAccountByHomeId: sinon.SinonStub };
  const AUTH_CODE_URL = "https://login.microsoftonline.com/auth/";
  let service: EntraService;
  const AUTH_CODE = "auth-code";
  const CHALLENGE = "test-challenge";
  const VERIFIER = "test-verifier";
  const ID_TOKEN = "id-token";
  const ACCESS_TOKEN = "access-token";
  const HOME_ACCOUNT_ID = "uid.tenant";
  const ACCOUNT: AccountInfo = {
    environment: "login.microsoftonline.com",
    homeAccountId: HOME_ACCOUNT_ID,
    localAccountId: "uid",
    tenantId: "tenant",
    username: "user@example.com",
  };
  const DOWNSTREAM_SCOPES = ["api://rcw/Applications.Read"];
  const TOKEN_EXPIRY = new Date(Date.now() + 3600 * 1000);
  const SESSION_SECRET = process.env.SESSION_SECRET as string;
  const REDIRECT_URI_HOSTNAME = new URL(authRequestDefaults.redirectUri)
    .hostname;
  const EPHEMERAL_HOSTNAME =
    "el-257-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";

  beforeEach(() => {
    tokenCacheStub = {
      getAccountByHomeId: sinon.stub().resolves(ACCOUNT),
    };

    msalStub = {
      acquireTokenByCode: sinon.stub().resolves({
        account: ACCOUNT,
        idToken: ID_TOKEN,
        accessToken: ACCESS_TOKEN,
        expiresOn: TOKEN_EXPIRY,
      }),
      acquireTokenSilent: sinon.stub().resolves({
        account: ACCOUNT,
        idToken: ID_TOKEN,
        accessToken: ACCESS_TOKEN,
        expiresOn: TOKEN_EXPIRY,
      }),
      getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL),
      getTokenCache: sinon.stub().returns(tokenCacheStub),
    };

    service = EntraService.create({
      msalClient: msalStub as ConfidentialClientApplication,
    });

    sinon.stub(CryptoProvider.prototype, "generatePkceCodes").resolves({
      verifier: VERIFIER,
      challenge: CHALLENGE,
    });
  });

  afterEach(() => sinon.restore());

  describe("create() factory method", () => {
    it("returns an EntraService instance", () => {
      const result = EntraService.create({
        msalClient: msalStub as ConfidentialClientApplication,
      });

      expect(result).to.be.an.instanceOf(EntraService);
    });

    it("uses the supplied msalClient when provided", () => {
      const providedClient = msalStub as ConfidentialClientApplication;

      const result = EntraService.create({
        msalClient: providedClient,
      });

      expect(result.msalClient).to.equal(providedClient);
    });

    it("throws when msalClient does not expose required methods", () => {
      expect(() =>
        EntraService.create({
          msalClient: {} as unknown as ConfidentialClientApplication,
        }),
      ).to.throw(
        TypeError,
        "EntraService.create requires an msalClient with MSAL auth methods",
      );
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
        (await service.initiateAuthCodeFlow(undefined, {
          callbackHostname: REDIRECT_URI_HOSTNAME,
        })) as Success<AuthCodeFlowState>;
      const parsed = parseRelayState(result.value.authState);
      expect(parsed).to.be.null;
    });

    it("creates a relay state with target and sig when requestHostname differs from redirect URI hostname", async () => {
      const ephemeralService = EntraService.create({
        msalClient: msalStub as ConfidentialClientApplication,
      });
      const result =
        (await ephemeralService.initiateAuthCodeFlow(undefined, {
          callbackHostname: EPHEMERAL_HOSTNAME,
        })) as Success<AuthCodeFlowState>;
      const parsed = parseRelayState(result.value.authState);
      expect(parsed).to.not.be.null;
      expect(parsed!.target).to.equal(`https://${EPHEMERAL_HOSTNAME}`);
      expect(verifyRelayState(parsed!, SESSION_SECRET)).to.be.true;
    });

    it("normalizes callbackHostname to lowercase", async () => {
      const mixedCaseHostname = REDIRECT_URI_HOSTNAME.toUpperCase();
      const result = (await service.initiateAuthCodeFlow(undefined, {
        callbackHostname: mixedCaseHostname,
      })) as Success<AuthCodeFlowState>;
      expect(parseRelayState(result.value.authState)).to.be.null;
    });

    it("throws when callbackHostname is empty", async () => {
      let error: unknown;
      try {
        await service.initiateAuthCodeFlow(undefined, {
          callbackHostname: "   ",
        });
      } catch (caught) {
        error = caught;
      }

      expect(error).to.be.instanceOf(TypeError);
      expect((error as Error).message).to.equal(
        "EntraService.initiateAuthCodeFlow requires a non-empty callbackHostname",
      );
    });

    it("throws when callbackHostname is not a hostname", async () => {
      let error: unknown;
      try {
        await service.initiateAuthCodeFlow(undefined, {
          callbackHostname: "https://example.com/callback",
        });
      } catch (caught) {
        error = caught;
      }

      expect(error).to.be.instanceOf(TypeError);
      expect((error as Error).message).to.equal(
        "EntraService.initiateAuthCodeFlow requires callbackHostname to be a valid hostname",
      );
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
      msalStub.acquireTokenByCode = sinon.stub().resolves({
        account: ACCOUNT,
        idToken: ID_TOKEN,
        accessToken: ACCESS_TOKEN,
        expiresOn: TOKEN_EXPIRY,
      });
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

  describe("acquireDownstreamAccessToken()", () => {
    beforeEach(() => {
      msalStub.acquireTokenSilent = sinon.stub().resolves({
        account: ACCOUNT,
        idToken: ID_TOKEN,
        accessToken: ACCESS_TOKEN,
        expiresOn: TOKEN_EXPIRY,
      });
      tokenCacheStub.getAccountByHomeId.resolves(ACCOUNT);
    });

    it("returns a refreshed access token on success", async () => {
      const result = await service.acquireDownstreamAccessToken(
        HOME_ACCOUNT_ID,
        DOWNSTREAM_SCOPES,
      );

      expect(result.error).to.be.undefined;
      if (result.error !== undefined) {
        throw result.error;
      }
      expect(result.value).to.equal(ACCESS_TOKEN);
    });

    it("resolves account from cache using getAccountByHomeId", async () => {
      await service.acquireDownstreamAccessToken(
        HOME_ACCOUNT_ID,
        DOWNSTREAM_SCOPES,
      );

      expect(
        tokenCacheStub.getAccountByHomeId.calledOnceWithExactly(HOME_ACCOUNT_ID),
      ).to.be.true;
    });

    it("passes the cached home account ID and scopes to acquireTokenSilent", async () => {
      await service.acquireDownstreamAccessToken(
        HOME_ACCOUNT_ID,
        DOWNSTREAM_SCOPES,
      );

      const [requestArg] = (msalStub.acquireTokenSilent as sinon.SinonStub)
        .args[0];
      expect(requestArg.account).to.equal(ACCOUNT);
      expect(requestArg.scopes).to.deep.equal(DOWNSTREAM_SCOPES);
    });

    it("returns NotAuthenticatedError when homeAccountId is missing", async () => {
      const result = await service.acquireDownstreamAccessToken(
        "  ",
        DOWNSTREAM_SCOPES,
      );

      expect(result.error)
        .to.be.an("error")
        .and.to.be.instanceOf(NotAuthenticatedError);
      expect(tokenCacheStub.getAccountByHomeId.called).to.be.false;
      expect((msalStub.acquireTokenSilent as sinon.SinonStub).called).to.be
        .false;
    });

    it("returns NotAuthenticatedError when cached account cannot be found", async () => {
      tokenCacheStub.getAccountByHomeId.resolves(null);

      const result = await service.acquireDownstreamAccessToken(
        HOME_ACCOUNT_ID,
        DOWNSTREAM_SCOPES,
      );

      expect(result.error)
        .to.be.an("error")
        .and.to.be.instanceOf(NotAuthenticatedError);
      expect((msalStub.acquireTokenSilent as sinon.SinonStub).called).to.be
        .false;
    });

    it("returns NotAuthenticatedError when interaction is required", async () => {
      (msalStub.acquireTokenSilent as sinon.SinonStub).rejects(
        new InteractionRequiredAuthError("interaction_required", "reauth"),
      );

      const result = await service.acquireDownstreamAccessToken(
        HOME_ACCOUNT_ID,
        DOWNSTREAM_SCOPES,
      );

      expect(result.error)
        .to.be.an("error")
        .and.to.be.instanceOf(NotAuthenticatedError);
      expect((msalStub.acquireTokenSilent as sinon.SinonStub).calledOnce).to.be
        .true;
    });

    it("returns a TokenRefreshError failure when acquireTokenSilent throws unexpectedly", async () => {
      (msalStub.acquireTokenSilent as sinon.SinonStub).rejects(
        new Error("silent failure"),
      );

      const result = await service.acquireDownstreamAccessToken(
        HOME_ACCOUNT_ID,
        DOWNSTREAM_SCOPES,
      );

      expect(result.error)
        .to.be.an("error")
        .and.to.be.instanceOf(TokenRefreshError);
      expect(result.error?.cause).to.have.property("message", "silent failure");
    });
  });
});
