import {
  type AccountInfo,
  type AuthenticationResult,
  type AuthorizationCodeRequest,
  type AuthorizationUrlRequest,
  type ConfidentialClientApplication,
  CryptoProvider,
} from "@azure/msal-node";
import { randomUUID } from "node:crypto";

import type {
  AuthCodeFlowState,
  PKCECodes,
  TokenExchangeResult,
} from "#/auth/auth.types.js";

import { authRequestDefaults } from "#/auth/auth.config.js";
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
  msalClient: ConfidentialClientApplication;
  requestHostname: string;
}

const EMPTY_HOSTNAME_LENGTH = 0;

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
   * Factory method to create a new EntraService instance.
   * @param {config} config - Configuration for the EntraService, including request hostname and an MSAL client.
   * @returns {EntraService} A new EntraService instance.
   */
  public static create({
    msalClient,
    requestHostname,
  }: EntraServiceConfig): EntraService {
    validateMsalClient(msalClient);
    const normalizedHostname = normalizeRequestHostname(requestHostname);

    return new EntraService(normalizedHostname, msalClient);
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
    const redirectHostname = new URL(authRequestDefaults.redirectUri).hostname;
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
        redirectUri: authRequestDefaults.redirectUri,
        scopes: authRequestDefaults.scopes,
      } satisfies AuthorizationCodeRequest,

      authCodeUrlRequest: {
        codeChallenge: challenge,
        codeChallengeMethod: challengeMethod,
        prompt: authRequestDefaults.prompt,
        redirectUri: authRequestDefaults.redirectUri,
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

/**
 * Validates the hostname format accepted by EntraService.
 * @param hostname - Candidate hostname value.
 * @returns True when the value is a valid bare hostname.
 */
function isValidHostname(hostname: string): boolean {
  try {
    const parsed = new URL(`https://${hostname}`);
    return parsed.hostname === hostname;
  } catch {
    return false;
  }
}

/**
 * Validates and normalizes the request hostname invariant.
 * @param requestHostname - Raw request hostname from the caller.
 * @returns A normalized, lowercase hostname.
 */
function normalizeRequestHostname(requestHostname: string): string {
  const normalizedHostname = requestHostname.trim().toLowerCase();

  if (normalizedHostname.length === EMPTY_HOSTNAME_LENGTH) {
    throw new TypeError(
      "EntraService.create requires a non-empty requestHostname",
    );
  }

  if (!isValidHostname(normalizedHostname)) {
    throw new TypeError(
      "EntraService.create requires requestHostname to be a valid hostname",
    );
  }

  return normalizedHostname;
}

/**
 * Validates that the supplied client provides the MSAL methods required by the service.
 * @param msalClient - Candidate MSAL client.
 */
function validateMsalClient(
  msalClient: unknown,
): asserts msalClient is ConfidentialClientApplication {
  if (msalClient === undefined || msalClient === null) {
    throw new TypeError("EntraService.create requires a configured msalClient");
  }

  const candidate = msalClient as Partial<
    Record<
      "acquireTokenByCode" | "acquireTokenSilent" | "getAuthCodeUrl",
      unknown
    >
  >;

  if (
    typeof candidate.acquireTokenByCode !== "function" ||
    typeof candidate.acquireTokenSilent !== "function" ||
    typeof candidate.getAuthCodeUrl !== "function"
  ) {
    throw new TypeError(
      "EntraService.create requires an msalClient with MSAL auth methods",
    );
  }
}
