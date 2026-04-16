import type { SessionData } from "express-session";
import {
  type ConfidentialClientApplication,
  CryptoProvider,
  type AuthorizationUrlRequest,
  type AuthenticationResult,
} from "@azure/msal-node";
import config from "#config.js";
import { authScopes } from "#src/config/auth.js";
import {
  type AuthCodeResponse,
  type AuthState,
  authStateSchema,
  type PKCECodes,
} from "#types/auth-types.js";

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
   * @param {SessionData} session - The Express session used to store PKCE codes and auth request state.
   * @returns {Promise<string>} The authorisation URL to redirect the user to.
   */
  public async getAuthCodeUrl(session: SessionData): Promise<string> {
    const authCodeUrlRequest: AuthorizationUrlRequest =
      await this.createAuthCodeRequest(session);
    try {
      return await this.msalClient.getAuthCodeUrl(authCodeUrlRequest);
    } catch (error) {
      console.error("Failed to generate Entra auth code URL:", error);
      throw error;
    }
  }

  /**
   * Exchanges the authorisation code from the Entra redirect for tokens and updates the session.
   * @param {AuthCodeResponse} requestBody - The validated redirect payload containing the auth code and state.
   * @returns {Promise<AuthState>} The decoded auth state containing the post-login redirect URL.
   */
  public async processAuthCodeCallback(
    requestBody: AuthCodeResponse,
  ): Promise<AuthState> {
    if (this.session.authCodeRequest === undefined) {
      throw new Error("Missing auth code request in session");
    }

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

      const decoded = this.cryptoProvider.base64Decode(requestBody.state);
      return authStateSchema.parse(JSON.parse(decoded));
    } catch (error) {
      console.error("Failed to handle Entra auth redirect:", error);
      throw error;
    }
  }

  /**
   * Builds the Microsoft Entra ID logout URL including the post-logout redirect URI.
   * @returns {string} The fully-formed Entra logout URL.
   */
  public static getLogoutUrl(): string {
    return `${config.entra.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${config.entra.postLogoutRedirectUri}`;
  }

  /**
   * Generates a PKCE code verifier and challenge pair using the S256 method.
   * @returns {Promise<PKCECodes>} The generated PKCE codes.
   */
  private async getPkceCodes(): Promise<PKCECodes> {
    const { verifier, challenge } =
      await this.cryptoProvider.generatePkceCodes();

    return {
      challengeMethod: "S256",
      verifier,
      challenge,
    };
  }

  /**
   * Builds the MSAL authorisation URL request and stores PKCE state on the session.
   * @param {SessionData} session - The Express session used to persist PKCE codes and auth request data.
   * @returns {Promise<AuthorizationUrlRequest>} The authorisation URL request object for MSAL.
   */
  private async createAuthCodeRequest(
    session: SessionData,
  ): Promise<AuthorizationUrlRequest> {
    const pkceCodes: PKCECodes = await this.getPkceCodes();
    const { challenge, challengeMethod, verifier } = pkceCodes;
    const { returnTo } = session;
    const successRedirect =
      returnTo?.startsWith("/") === true && !returnTo.startsWith("//")
        ? returnTo
        : "/landing";
    session.returnTo = undefined;

    const state: string = this.cryptoProvider.base64Encode(
      JSON.stringify({ successRedirect }),
    );

    const authCodeUrlRequest: AuthorizationUrlRequest = {
      state,
      scopes: authScopes,
      redirectUri: config.entra.redirectUri,
      responseMode: "form_post",
      codeChallenge: challenge,
      codeChallengeMethod: challengeMethod,
    };

    session.pkceCodes = pkceCodes;
    session.authCodeUrlRequest = authCodeUrlRequest;
    session.authCodeRequest = {
      code: "",
      codeVerifier: verifier,
      scopes: authScopes,
      redirectUri: config.entra.redirectUri,
    };

    return authCodeUrlRequest;
  }
}
