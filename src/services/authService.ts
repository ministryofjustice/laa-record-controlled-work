import type { SessionData } from "#node_modules/@types/express-session/index.js";
import {
  type ConfidentialClientApplication,
  CryptoProvider,
  type AuthorizationUrlRequest,
  type AuthenticationResult,
} from "@azure/msal-node";
import config from "#config.js";
import {
  authStateSchema,
  type AuthState,
  type AuthCodeResponse,
} from "#src/config/zod/authSchema.js";
import type { PKCECodes } from "#types/auth-types.js";

/**
 *
 */
export class AuthService {
  public session: SessionData;
  public msalClient: ConfidentialClientApplication;
  private readonly cryptoProvider: CryptoProvider = new CryptoProvider();

  /**
   *
   * @param sessionData
   * @param msalClient
   */
  private constructor(
    sessionData: SessionData,
    msalClient: ConfidentialClientApplication,
  ) {
    this.session = sessionData;
    this.msalClient = msalClient;
  }

  /**
   *
   * @param sessionData
   * @param msalClient
   */
  public static create(
    sessionData: SessionData,
    msalClient: ConfidentialClientApplication,
  ): AuthService {
    return new AuthService(sessionData, msalClient);
  }

  /**
   *
   * @param session
   */
  public async getAuthCodeUrl(session: SessionData): Promise<string> {
    const authCodeUrlRequest: AuthorizationUrlRequest =
      await this.createAuthCodeRequest(session);

    try {
      return await this.msalClient.getAuthCodeUrl(authCodeUrlRequest);
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param authCode
   * @param requestBody
   */
  public async handleRedirect(
    requestBody: AuthCodeResponse,
  ): Promise<AuthState> {
    if (!this.session.authCodeRequest) {
      throw new Error("Missing auth code request in session");
    }

    this.session.authCodeRequest.code = requestBody.code;

    try {
      const tokenResponse: AuthenticationResult =
        await this.msalClient.acquireTokenByCode(
          this.session.authCodeRequest,
          requestBody,
        );

      if (!tokenResponse) {
        throw new Error("Token response is null or undefined");
      }

      this.session.tokenCache = this.msalClient.getTokenCache().serialize();
      this.session.idToken = tokenResponse.idToken;
      this.session.account = tokenResponse.account ?? undefined;
      this.session.isAuthenticated = true;

      const decoded = this.cryptoProvider.base64Decode(requestBody.state);
      return authStateSchema.parse(JSON.parse(decoded));
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   */
  public getLogoutUrl(): string {
    return `${config.entra.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${config.entra.postLogoutRedirectUri}`;
  }

  /**
   *
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
   *
   * @param session
   */
  private async createAuthCodeRequest(
    session: SessionData,
  ): Promise<AuthorizationUrlRequest> {
    const scopes: string[] = [];

    const pkceCodes: PKCECodes = await this.getPkceCodes();
    const { challenge, challengeMethod, verifier } = pkceCodes;
    const state: string = this.cryptoProvider.base64Encode(
      JSON.stringify({
        successRedirect: session.returnTo ?? "/",
      }),
    );

    const authCodeUrlRequest: AuthorizationUrlRequest = {
      state,
      scopes,
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
      scopes,
      redirectUri: config.entra.redirectUri,
    };

    return authCodeUrlRequest;
  }
}
