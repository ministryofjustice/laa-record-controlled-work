import {
  ConfidentialClientApplication,
  CryptoProvider,
  InteractionRequiredAuthError,
  ProtocolMode,
  type AccountInfo,
  type AuthenticationResult,
  type AuthorizationCodeRequest,
  type INetworkModule,
  type NetworkRequestOptions,
} from "@azure/msal-node";
import { createSign, generateKeyPairSync } from "node:crypto";
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
import { MINUTE } from "#/lib/constants/time.js";

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
  const FLOW_EXPIRY = Date.now() + 10 * MINUTE;
  const SESSION_SECRET = process.env.SESSION_SECRET as string;
  const REDIRECT_URI_HOSTNAME = new URL(authRequestDefaults.redirectUri)
    .hostname;
  const EPHEMERAL_HOSTNAME =
    "el-257-laa-record-controlled-work-uat.cloud-platform.service.justice.gov.uk";
  const OIDC_NONCE = "expected-oidc-nonce";

  const syntheticAuthority = "https://nonce.test/tenant";
  const syntheticIssuer = `${syntheticAuthority}/v2.0`;
  const syntheticTokenEndpoint = `${syntheticAuthority}/oauth2/v2.0/token`;
  const syntheticJwksUri = "https://nonce.test/keys";
  const syntheticClientId = "synthetic-client-id";
  const syntheticKeyId = "synthetic-signing-key";
  const { privateKey: syntheticPrivateKey, publicKey: syntheticPublicKey } =
    generateKeyPairSync("rsa", { modulusLength: 2048 });
  const syntheticPublicJwk = {
    ...syntheticPublicKey.export({ format: "jwk" }),
    alg: "RS256",
    kid: syntheticKeyId,
    use: "sig",
  };

  function createSyntheticIdToken(
    claims: Record<string, unknown>,
  ): string {
    const encodedHeader = Buffer.from(
      JSON.stringify({ alg: "RS256", kid: syntheticKeyId, typ: "JWT" }),
    ).toString("base64url");
    const encodedClaims = Buffer.from(JSON.stringify(claims)).toString(
      "base64url",
    );
    const signer = createSign("RSA-SHA256");
    signer.update(`${encodedHeader}.${encodedClaims}`);
    signer.end();

    return `${encodedHeader}.${encodedClaims}.${signer
      .sign(syntheticPrivateKey)
      .toString("base64url")}`;
  }

  function createSyntheticIdTokenWithNonce(
    nonce: unknown,
    includeNonce = true,
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const claims: Record<string, unknown> = {
      aud: syntheticClientId,
      exp: now + 3600,
      iat: now,
      iss: syntheticIssuer,
      sub: "synthetic-subject",
      tid: "synthetic-tenant",
      ver: "2.0",
    };
    if (includeNonce) claims.nonce = nonce;
    return createSyntheticIdToken(claims);
  }

  function createSyntheticTokenResponse(
    idToken?: string,
  ): Record<string, unknown> {
    return {
      access_token: "synthetic-access-token",
      expires_in: 3600,
      ...(idToken === undefined ? {} : { id_token: idToken }),
      refresh_token: "synthetic-refresh-token",
      scope: "openid profile",
      token_type: "Bearer",
    };
  }

  function createSyntheticMsalClient(
    tokenResponse: Record<string, unknown>,
    tokenRequests: string[],
  ): ConfidentialClientApplication {
    const metadata = JSON.stringify({
      authorization_endpoint: `${syntheticAuthority}/oauth2/v2.0/authorize`,
      code_challenge_methods_supported: ["S256"],
      end_session_endpoint: `${syntheticAuthority}/oauth2/v2.0/logout`,
      id_token_signing_alg_values_supported: ["RS256"],
      issuer: syntheticIssuer,
      jwks_uri: syntheticJwksUri,
      response_modes_supported: ["query"],
      response_types_supported: ["code"],
      subject_types_supported: ["pairwise"],
      token_endpoint: syntheticTokenEndpoint,
    });
    const cloudDiscoveryMetadata = JSON.stringify({
      metadata: [
        {
          aliases: ["nonce.test"],
          preferred_cache: "nonce.test",
          preferred_network: "nonce.test",
        },
      ],
      tenant_discovery_endpoint: `${syntheticAuthority}/v2.0/.well-known/openid-configuration`,
    });
    const networkClient: INetworkModule = {
      async sendGetRequestAsync<T>() {
        return {
          body: { keys: [syntheticPublicJwk] } as T,
          headers: {},
          status: 200,
        };
      },
      async sendPostRequestAsync<T>(
        _url: string,
        options?: NetworkRequestOptions,
      ) {
        tokenRequests.push(options?.body ?? "");
        return {
          body: tokenResponse as T,
          headers: {},
          status: 200,
        };
      },
    };

    return new ConfidentialClientApplication({
      auth: {
        authority: syntheticAuthority,
        authorityMetadata: metadata,
        clientId: syntheticClientId,
        clientSecret: "synthetic-client-secret",
        cloudDiscoveryMetadata,
        knownAuthorities: ["nonce.test"],
      },
      system: { networkClient, protocolMode: ProtocolMode.OIDC },
    });
  }

  function createSyntheticAuthCodeRequest(
    nonce: unknown = OIDC_NONCE,
    includeNonce = true,
  ): AuthorizationCodeRequest {
    return {
      code: "synthetic-authorization-code",
      codeVerifier: "synthetic-code-verifier",
      redirectUri: "http://localhost/auth/code/callback",
      scopes: ["openid", "profile"],
      ...(includeNonce ? { nonce } : {}),
    } as AuthorizationCodeRequest;
  }

  function expectEmptyTokenCache(
    msalClient: ConfidentialClientApplication,
  ): void {
    const cache = JSON.parse(
      msalClient.getTokenCache().serialize(),
    ) as Record<string, Record<string, unknown>>;

    for (const key of ["Account", "IdToken", "AccessToken", "RefreshToken"]) {
      expect(cache[key] ?? {}, `${key} cache`).to.be.empty;
    }
  }

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
      expect(result.value).to.not.have.property("authCodeUrlRequest");
    });

    it("returns a random authState and passes it as the state parameter", async () => {
      const result =
        (await service.initiateAuthCodeFlow()) as Success<AuthCodeFlowState>;
      expect(result.value.authState)
        .to.be.a("string")
        .with.length.greaterThan(0);
      const [requestArg] = (msalStub.getAuthCodeUrl as sinon.SinonStub).args[0];
      expect(requestArg.state).to.equal(result.value.authState);
      expect(requestArg.nonce).to.be.a("string").with.length.greaterThan(0);
      expect(result.value.authCodeRequest.nonce).to.equal(requestArg.nonce);

      const stateNonce = JSON.parse(
        new CryptoProvider().base64Decode(requestArg.state),
      ).nonce as string;
      expect(stateNonce).to.not.equal(requestArg.nonce);
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

    for (const returnTo of [
      "/auth",
      "/AUTH/code/callback",
      "/%61uth/code/callback",
      "/cases/%2e%2e/auth/code/callback",
      "/cases/%252f%252fauth",
      "/cases/%ZZ",
    ]) {
      it(`falls back to / for unsafe returnTo ${returnTo}`, async () => {
        const result = (await service.initiateAuthCodeFlow(
          returnTo,
        )) as Success<AuthCodeFlowState>;

        expect(result.value.returnTo).to.equal("/");
      });
    }

    it("preserves an authentication-like prefix and escaped query data", async () => {
      const returnTo = "/authentication?next=%2Fauth#summary";
      const result = (await service.initiateAuthCodeFlow(
        returnTo,
      )) as Success<AuthCodeFlowState>;

      expect(result.value.returnTo).to.equal(returnTo);
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
          expiresAt: FLOW_EXPIRY,
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

  describe("refreshToken()", () => {
    beforeEach(() => {
      msalStub.acquireTokenSilent = sinon.stub().resolves({
        account: ACCOUNT,
        idToken: ID_TOKEN,
        accessToken: ACCESS_TOKEN,
        expiresOn: TOKEN_EXPIRY,
      });
    });

    it("returns a refreshed access token on success", async () => {
      const result = await service.refreshToken(
        HOME_ACCOUNT_ID,
        DOWNSTREAM_SCOPES,
      );

      expect(result.error).to.be.undefined;

      // @ts-expect-error - result is a Success<TokenExchangeResult> when error is undefined
      const { account, idToken, accessToken, expiresOn } = result.value;

      expect(account).to.equal(ACCOUNT);
      expect(idToken).to.equal(ID_TOKEN);
      expect(accessToken).to.equal(ACCESS_TOKEN);
      expect(expiresOn).to.equal(TOKEN_EXPIRY);
    });

    it("returns a TokenRefreshError failure when the cached account cannot be found", async () => {
      tokenCacheStub.getAccountByHomeId.resolves(null);

      const result = await service.refreshToken(
        HOME_ACCOUNT_ID,
        DOWNSTREAM_SCOPES,
      );

      expect(result.error).to.be.instanceOf(TokenRefreshError);
    });

    it("returns a TokenRefreshError failure when acquireTokenSilent throws", async () => {
      const silentFailure = new Error("silent failure");

      (msalStub.acquireTokenSilent as sinon.SinonStub).rejects(silentFailure);

      const result = await service.refreshToken(
        HOME_ACCOUNT_ID,
        DOWNSTREAM_SCOPES,
      );

      expect(result.error).to.be.instanceOf(TokenRefreshError);
      expect(result.error?.cause).to.equal(silentFailure);
    });
  });

  describe("exchangeAuthCode()", () => {
    let authCodeRequest: {
      code: string;
      codeVerifier: string;
      scopes: string[];
      redirectUri: string;
      nonce: string;
    };

    beforeEach(() => {
      authCodeRequest = {
        code: "",
        codeVerifier: VERIFIER,
        scopes: [],
        redirectUri: "http://localhost/auth/code/callback",
        nonce: OIDC_NONCE,
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

    it("rejects missing, empty, or non-string expected nonces before contacting MSAL", async () => {
      for (const [label, request] of [
        ["missing", createSyntheticAuthCodeRequest(undefined, false)],
        ["empty", createSyntheticAuthCodeRequest("")],
        ["non-string", createSyntheticAuthCodeRequest(17)],
      ] as const) {
        const tokenRequests: string[] = [];
        const tokenResponse = createSyntheticTokenResponse(
          createSyntheticIdTokenWithNonce(undefined, false),
        );
        const msalClient = createSyntheticMsalClient(
          tokenResponse,
          tokenRequests,
        );
        const result = await EntraService.create({ msalClient }).exchangeAuthCode(
          "synthetic-authorization-code",
          request,
        );

        expect(result.error, label).to.be.instanceOf(TokenAcquisitionError);
        expect(tokenRequests, label).to.be.empty;
        expectEmptyTokenCache(msalClient);
      }
    });

    it("accepts a matching ID-token nonce through MSAL", async () => {
      const tokenRequests: string[] = [];
      const idToken = createSyntheticIdTokenWithNonce(OIDC_NONCE);
      const msalClient = createSyntheticMsalClient(
        createSyntheticTokenResponse(idToken),
        tokenRequests,
      );
      const result = await EntraService.create({ msalClient }).exchangeAuthCode(
        "synthetic-authorization-code",
        createSyntheticAuthCodeRequest(),
      );

      expect(result.error).to.be.undefined;
      if (result.error) throw result.error;
      expect(result.value.idToken).to.equal(idToken);
      expect(tokenRequests).to.have.length(1);
      const cache = JSON.parse(
        msalClient.getTokenCache().serialize(),
      ) as Record<string, Record<string, unknown>>;
      for (const key of ["Account", "IdToken", "AccessToken", "RefreshToken"]) {
        expect(cache[key] ?? {}, `${key} cache`).to.not.be.empty;
      }
    });

    for (const [label, idToken] of [
      ["missing ID token", undefined],
      [
        "missing nonce claim",
        createSyntheticIdTokenWithNonce(undefined, false),
      ],
      ["mismatched nonce", createSyntheticIdTokenWithNonce("wrong-nonce")],
      ["non-string nonce", createSyntheticIdTokenWithNonce(17)],
      [
        "nonce from another flow",
        createSyntheticIdTokenWithNonce("another-flow-nonce"),
      ],
    ] as const) {
      it(`rejects ${label} without caching tokens`, async () => {
        const tokenRequests: string[] = [];
        const msalClient = createSyntheticMsalClient(
          createSyntheticTokenResponse(idToken),
          tokenRequests,
        );
        const result = await EntraService.create({ msalClient }).exchangeAuthCode(
          "synthetic-authorization-code",
          createSyntheticAuthCodeRequest(),
        );

        expect(result.error, label).to.be.instanceOf(TokenAcquisitionError);
        expect(tokenRequests).to.have.length(1);
        expectEmptyTokenCache(msalClient);
      });
    }
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
