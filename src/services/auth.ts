import { randomUUID } from "node:crypto";
import type { SessionData } from "express-session";
import {
  type ConfidentialClientApplication,
  CryptoProvider,
  type AuthorizationUrlRequest,
  type AuthenticationResult,
} from "@azure/msal-node";
import config from "#src/config.js";
import { authRequestDefaults } from "#src/config/auth.js";
import { failure, success, type Either } from "#src/lib/either.js";
import type { AuthCodeResponse, PKCECodes } from "#src/types/auth-types.js";
import { devError } from "#src/lib/devLogger.js";
import {
  MissingAuthCodeRequestError,
  MsalError,
  PkceGenerationError,
  StateMismatchError,
  TokenAcquisitionError,
} from "#src/lib/errors/auth.js";

/**
 * Handles Microsoft Entra ID (MSAL) authentication flows including
 * PKCE code exchange, token acquisition, and logout URL generation.
 */
export class AuthService {
  public session: SessionData;
  public msalClient: ConfidentialClientApplication;
  private readonly cryptoProvider: CryptoProvider = new CryptoProvider();

  /**
   * Creates an AuthService instance with the given session and MSAL client.
   * @param {SessionData} sessionData - The Express session data object.
   * @param {ConfidentialClientApplication} msalClient - The MSAL confidential client application.
   */
  private constructor(
    sessionData: SessionData,
    msalClient: ConfidentialClientApplication,
  ) {
    this.session = sessionData;
    this.msalClient = msalClient;
  }

  /**
   * Factory method to create a new AuthService instance.
   * @param {SessionData} sessionData - The Express session data object.
   * @param {ConfidentialClientApplication} msalClient - The MSAL confidential client application.
   * @returns {AuthService} A new AuthService instance.
   */
  public static create(
    sessionData: SessionData,
    msalClient: ConfidentialClientApplication,
  ): AuthService {
    return new AuthService(sessionData, msalClient);
  }

  /**
   * Generates the Microsoft Entra ID authorisation URL to begin the PKCE sign-in flow.
   * @returns {Promise<Either<AuthError, string>>} The authorisation URL or an auth error.
   */
  public async getAuthCodeUrl(): Promise<
    Either<PkceGenerationError | MsalError, string>
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
      const { idToken, account }: AuthenticationResult =
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
   * Builds the Microsoft Entra ID logout URL including the post-logout redirect URI.
   * @param {string} [idToken] - The ID token to include as a hint for Entra to end the correct session.
   * @returns {string} The fully-formed Entra logout URL.
   */
  public static getLogoutUrl(idToken?: string): string {
    const params = new URLSearchParams({
      post_logout_redirect_uri: config.entra.postLogoutRedirectUri,
    });
    if (idToken !== undefined) {
      params.set("id_token_hint", idToken);
    }
    return `${config.entra.authority}/oauth2/v2.0/logout?${params.toString()}`;
  }

  /**
   * Generates a PKCE code verifier and challenge pair using the S256 method.
   * @returns {Promise<PKCECodes>} The generated PKCE codes.
   */
  private async getPkceCodes(): Promise<
    Either<PkceGenerationError, PKCECodes>
  > {
    try {
      const { verifier, challenge } =
        await this.cryptoProvider.generatePkceCodes();
      return success({ challengeMethod: "S256", verifier, challenge });
    } catch (error) {
      devError(`Failed to generate PKCE codes: ${String(error)}`);
      return failure(PkceGenerationError.from(error));
    }
  }

  /**
   * Builds the MSAL authorisation URL request and stores PKCE state on the session.
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
    const nonce = this.cryptoProvider.base64Encode(
      JSON.stringify({ id: randomUUID() }),
    );
    this.session.authState = nonce;

    const authCodeUrlRequest: AuthorizationUrlRequest = {
      state: nonce,
      scopes: authRequestDefaults.scopes,
      redirectUri: authRequestDefaults.redirectUri,
      responseMode: authRequestDefaults.responseMode,
      codeChallenge: challenge,
      codeChallengeMethod: challengeMethod,
      prompt: authRequestDefaults.prompt,
    };

    this.session.pkceCodes = pkceCodes;
    this.session.authCodeUrlRequest = authCodeUrlRequest;
    this.session.authCodeRequest = {
      code: "",
      codeVerifier: verifier,
      scopes: authRequestDefaults.scopes,
      redirectUri: authRequestDefaults.redirectUri,
    };

    return authCodeUrlRequest;
  }
}
