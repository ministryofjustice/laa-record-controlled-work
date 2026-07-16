import {
  type AccountInfo,
  type AuthenticationResult,
  type AuthorizationCodeRequest,
  type AuthorizationUrlRequest,
  ConfidentialClientApplication,
  CryptoProvider,
  type ICachePlugin,
} from "@azure/msal-node";
import { randomUUID } from "node:crypto";

import type {
  AuthCodeFlowState,
  PKCECodes,
  TokenExchangeResult,
} from "#/auth/auth.types.js";

import { authRequestDefaults, msalConfig } from "#/auth/auth.config.js";
import {
  MsalError,
  PkceGenerationError,
  TokenAcquisitionError,
  TokenRefreshError,
} from "#/auth/auth.errors.js";
import { createRelayState } from "#/auth/auth.relay.js";
import config from "#/config.js";
import { type Either, failure, success } from "#/lib/either.js";
import { logger } from "#/logger.js";

interface EntraServiceConfig {
  cachePlugin?: ICachePlugin;
  msalClient?: ConfidentialClientApplication;
  requestHostname: string;
}

/**
 * Handles Microsoft Entra ID (MSAL) authentication flows including
 * PKCE code exchange, token acquisition, and logout URL generation.
 */
export class EntraService {
  public msalClient: ConfidentialClientApplication;
  private readonly cryptoProvider: CryptoProvider = new CryptoProvider();
  private readonly requestHostname: string;

  /**
   * Creates an EntraService instance.
   * @param {string} requestHostname - The hostname of the incoming request (e.g. "my-host.example.com").
   * @param {ConfidentialClientApplication} msalclient - The MSAL client instance to use for token acquisition and code exchange.
   */
  private constructor(
    requestHostname: string,
    msalclient: ConfidentialClientApplication,
  ) {
    this.requestHostname = requestHostname;
    this.msalClient = msalclient;
  }

  /**
   * Factory method to create a new EntraService instance with a default MSAL client.
   * @param {config} config - Configuration for the EntraService, including optional cache plugin and request hostname.
   * @returns {EntraService} A new EntraService instance.
   */
  public static create({
    cachePlugin,
    msalClient,
    requestHostname,
  }: EntraServiceConfig): EntraService {
    const client =
      msalClient ??
      new ConfidentialClientApplication({
        ...msalConfig,
        cache: { cachePlugin },
      });

    return new EntraService(requestHostname, client);
  }

  /**
   * Acquire a fresh access token using cached credentials.
   * Cache serialization/deserialization is handled automatically by the ICachePlugin.
   *
   * @param account - The authenticated account from the session.
   * @returns {Promise<Either<TokenRefreshError, TokenExchangeResult>>} The refreshed token set or an error.
   */
  public async acquireTokenSilent(
    account: AccountInfo,
  ): Promise<Either<TokenRefreshError, TokenExchangeResult>> {
    try {
      const result: AuthenticationResult =
        await this.msalClient.acquireTokenSilent({
          account,
          scopes: authRequestDefaults.scopes,
        });

      return success({
        accessToken: result.accessToken,
        account: result.account ?? undefined,
        idToken: result.idToken,
      });
    } catch (error) {
      logger.error("Failed to silently acquire token", error);
      return failure(TokenRefreshError.from(error));
    }
  }

  /**
   * Exchanges the authorisation code from the Entra redirect for tokens.
   * @param code - The authorisation code to exchange.
   * @param authCodeRequest - The stored MSAL code request from the sign-in initiation.
   * @returns {Promise<Either<TokenAcquisitionError, TokenExchangeResult>>} The acquired tokens or an auth error.
   */
  public async exchangeAuthCode(
    code: string,
    authCodeRequest: AuthorizationCodeRequest,
  ): Promise<Either<TokenAcquisitionError, TokenExchangeResult>> {
    const tokenRequest = { ...authCodeRequest, code };

    try {
      const { accessToken, account, idToken }: AuthenticationResult =
        await this.msalClient.acquireTokenByCode(tokenRequest);

      return success({
        accessToken,
        account: account ?? undefined,
        idToken,
      });
    } catch (error) {
      logger.error("Failed to handle Entra auth redirect", error);
      return failure(TokenAcquisitionError.from(error));
    }
  }

  /**
   * Generates the Microsoft Entra ID authorisation URL to begin the PKCE sign-in flow.
   * @param {string} [returnTo] - The path to redirect to after successful authentication.
   * @returns {Promise<Either<AuthError, AuthCodeFlowState>>} The auth flow initialisation data or an auth error.
   */
  public async initiateAuthCodeFlow(
    returnTo?: string,
  ): Promise<Either<MsalError | PkceGenerationError, AuthCodeFlowState>> {
    let pkceCodes: PKCECodes;
    try {
      const { challenge, verifier } =
        await this.cryptoProvider.generatePkceCodes();
      pkceCodes = { challenge, challengeMethod: "S256", verifier };
    } catch (error) {
      logger.error("Failed to generate PKCE codes", error);
      return failure(PkceGenerationError.from(error));
    }

    const prepared = this.prepareFlowState(pkceCodes, returnTo);
    try {
      const authCodeUrl = await this.msalClient.getAuthCodeUrl(
        prepared.authCodeUrlRequest,
      );
      return success({ authCodeUrl, ...prepared });
    } catch (error) {
      logger.error("Failed to generate Entra auth code URL", error);
      return failure(MsalError.from(error));
    }
  }

  /**
   * Builds the MSAL authorisation URL request and related auth flow state.
   * When the request hostname differs from the configured redirect URI hostname (ephemeral environments),
   * the state parameter includes a signed relay target so UAT can forward the callback.
   * @param pkceCodes - The PKCE code verifier, challenge, and challenge method.
   * @param returnTo - The post-authentication redirect path to validate.
   * @returns The auth flow state (excluding the auth code URL, which requires an MSAL call).
   */
  private prepareFlowState(
    pkceCodes: PKCECodes,
    returnTo?: string,
  ): Omit<AuthCodeFlowState, "authCodeUrl"> {
    const { challenge, challengeMethod, verifier } = pkceCodes;

    const validReturnTo =
      returnTo?.startsWith("/") === true && !returnTo.startsWith("//")
        ? returnTo
        : "/";

    // Cryptographically random nonce used as the OAuth state parameter for CSRF protection.
    // Validated against session.authState on callback before any token exchange.
    // Encoded as base64(JSON) so MSAL's parseRequestState can parse it without throwing invalid_state.
    const nonce = randomUUID();
    const redirectHostname = new URL(config.entra.redirectUri).hostname;
    const isRelay = this.requestHostname !== redirectHostname;

    const authState = isRelay
      ? createRelayState(
          nonce,
          `https://${this.requestHostname}`,
          config.session.secret,
        )
      : this.cryptoProvider.base64Encode(JSON.stringify({ nonce }));

    return {
      authCodeRequest: {
        code: "",
        codeVerifier: verifier,
        redirectUri: config.entra.redirectUri,
        scopes: authRequestDefaults.scopes,
      } satisfies AuthorizationCodeRequest,

      authCodeUrlRequest: {
        codeChallenge: challenge,
        codeChallengeMethod: challengeMethod,
        prompt: authRequestDefaults.prompt,
        redirectUri: config.entra.redirectUri,
        responseMode: authRequestDefaults.responseMode,
        scopes: authRequestDefaults.scopes,
        state: authState,
      } satisfies AuthorizationUrlRequest,

      authState,
      pkceCodes,
      returnTo: validReturnTo,
    };
  }
}
