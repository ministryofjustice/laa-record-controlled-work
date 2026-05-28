import type { SessionData } from "express-session";

import {
  type AuthenticationResult,
  type AuthorizationUrlRequest,
  ConfidentialClientApplication,
  CryptoProvider,
} from "@azure/msal-node";
import { randomUUID } from "node:crypto";

import type { AuthCodeResponse, PKCECodes } from "#/types/auth-types.js";

import config from "#/config.js";
import { authRequestDefaults, msalConfig } from "#/config/auth.js";
import { createRelayState } from "#/lib/auth.relay.js";
import { devError } from "#/lib/devLogger.js";
import { type Either, failure, success } from "#/lib/either.js";
import {
  MissingAuthCodeRequestError,
  MsalError,
  PkceGenerationError,
  StateMismatchError,
  TokenAcquisitionError,
} from "#/lib/errors/auth.js";

// TODO - this service is modifying the express-session by reference.
//        should probably consider pulling session mutation up and out
//        into a different module
// TODO - this service has a lot of mixed responsibilities and needs refactoring.

/**
 * Handles Microsoft Entra ID (MSAL) authentication flows including
 * PKCE code exchange, token acquisition, and logout URL generation.
 */
export class EntraService {
  public msalClient: ConfidentialClientApplication;
  public session: SessionData;
  private readonly cryptoProvider: CryptoProvider = new CryptoProvider();
  private readonly requestHostname: string;

  /**
   * Creates an EntraService instance with the given session and MSAL client.
   * @param {SessionData} sessionData - The Express session data object.
   * @param {string} requestHostname - The hostname of the incoming request (e.g. "my-host.example.com").
   * @param {ConfidentialClientApplication} msalClient - The MSAL confidential client application.
   */
  private constructor(
    sessionData: SessionData,
    requestHostname: string,
    msalClient?: ConfidentialClientApplication,
  ) {
    this.session = sessionData;
    this.requestHostname = requestHostname;
    this.msalClient =
      msalClient ?? new ConfidentialClientApplication(msalConfig);
  }

  /**
   * Factory method to create a new EntraService instance.
   * @param {SessionData} sessionData - The Express session data object.
   * @param {string} requestHostname - The hostname of the incoming request (e.g. "my-host.example.com").
   * @param {ConfidentialClientApplication} msalClient - The MSAL confidential client application.
   * @returns {EntraService} A new EntraService instance.
   */
  public static create(
    sessionData: SessionData,
    requestHostname: string,
    msalClient?: ConfidentialClientApplication,
  ): EntraService {
    return new EntraService(sessionData, requestHostname, msalClient);
  }

  /**
   * Generates the Microsoft Entra ID authorisation URL to begin the PKCE sign-in flow.
   * @returns {Promise<Either<AuthError, string>>} The authorisation URL or an auth error.
   */
  public async getAuthCodeUrl(): Promise<
    Either<MsalError | PkceGenerationError, string>
  > {
    const result = await this.getPkceCodes();
    if (result.error) return failure(PkceGenerationError.from(result.error));

    const authCodeUrlRequest = this.createAuthCodeRequest(result.value);
    try {
      const url = await this.msalClient.getAuthCodeUrl(authCodeUrlRequest);
      return success(url);
    } catch (error) {
      devError(`Failed to generate Entra auth code URL: ${String(error)}`);
      return failure(MsalError.from(error));
    }
  }

  /**
   * Exchanges the authorisation code from the Entra redirect for tokens and updates the session.
   * @param {AuthCodeResponse} requestBody - The validated redirect payload containing the auth code and state.
   * @returns {Promise<Either<AuthError, string>>} The decoded auth state or an auth error.
   */
  public async processAuthCodeCallback(
    requestBody: AuthCodeResponse,
  ): Promise<
    Either<
      MissingAuthCodeRequestError | StateMismatchError | TokenAcquisitionError,
      string
    >
  > {
    if (this.session.authCodeRequest === undefined) {
      return failure(new MissingAuthCodeRequestError());
    }

    if (
      this.session.authState === undefined ||
      requestBody.state !== this.session.authState
    ) {
      return failure(new StateMismatchError());
    }
    this.session.authState = undefined;

    const successRedirect = this.session.returnTo ?? "/landing";
    this.session.returnTo = undefined;

    const { code } = requestBody;
    this.session.authCodeRequest.code = code;

    try {
      const { account, idToken }: AuthenticationResult =
        await this.msalClient.acquireTokenByCode(
          this.session.authCodeRequest,
          requestBody,
        );
      this.session.tokenCache = this.msalClient.getTokenCache().serialize();
      this.session.idToken = idToken;
      this.session.account = account ?? undefined;
      this.session.isAuthenticated = true;

      return success(successRedirect);
    } catch (error) {
      devError(`Failed to handle Entra auth redirect: ${String(error)}`);
      return failure(TokenAcquisitionError.from(error));
    }
  }

  /**
   * Builds the MSAL authorisation URL request and stores PKCE state on the session.
   * When the request origin differs from the configured redirect URI origin (ephemeral environments),
   * the state parameter includes a signed relay target so UAT can forward the callback.
   * @param pkceCodes - The PKCE code verifier, challenge, and challenge method.
   * @returns {AuthorizationUrlRequest} The authorisation URL request object for MSAL.
   */
  private createAuthCodeRequest(pkceCodes: PKCECodes): AuthorizationUrlRequest {
    const { challenge, challengeMethod, verifier } = pkceCodes;
    const { returnTo } = this.session;

    // Validate the redirect target, then bind it to the session.
    this.session.returnTo =
      returnTo?.startsWith("/") === true &&
      !returnTo.startsWith("//") &&
      returnTo !== "/"
        ? returnTo
        : "/landing";

    // Cryptographically random nonce used as the OAuth state parameter for CSRF protection.
    // Validated against session.authState on callback before any token exchange.
    // Encoded as base64(JSON) so MSAL's parseRequestState can parse it without throwing invalid_state.
    const nonce = randomUUID();
    const redirectHostname = new URL(authRequestDefaults.redirectUri).hostname;
    const isRelay = this.requestHostname !== redirectHostname;

    const state = isRelay
      ? createRelayState(
          nonce,
          `https://${this.requestHostname}`,
          config.session.secret,
        )
      : this.cryptoProvider.base64Encode(JSON.stringify({ nonce }));

    this.session.authState = state;

    const authCodeUrlRequest: AuthorizationUrlRequest = {
      codeChallenge: challenge,
      codeChallengeMethod: challengeMethod,
      prompt: authRequestDefaults.prompt,
      redirectUri: authRequestDefaults.redirectUri,
      responseMode: authRequestDefaults.responseMode,
      scopes: authRequestDefaults.scopes,
      state,
    };

    this.session.pkceCodes = pkceCodes;
    this.session.authCodeUrlRequest = authCodeUrlRequest;
    this.session.authCodeRequest = {
      code: "",
      codeVerifier: verifier,
      redirectUri: authRequestDefaults.redirectUri,
      scopes: authRequestDefaults.scopes,
    };

    return authCodeUrlRequest;
  }

  /**
   * Generates a PKCE code verifier and challenge pair using the S256 method.
   * @returns {Promise<PKCECodes>} The generated PKCE codes.
   */
  private async getPkceCodes(): Promise<
    Either<PkceGenerationError, PKCECodes>
  > {
    try {
      const { challenge, verifier } =
        await this.cryptoProvider.generatePkceCodes();
      return success({ challenge, challengeMethod: "S256", verifier });
    } catch (error) {
      devError(`Failed to generate PKCE codes: ${String(error)}`);
      return failure(PkceGenerationError.from(error));
    }
  }
}
