import { SessionData } from "#node_modules/@types/express-session/index.js";
import {
  ConfidentialClientApplication,
  CryptoProvider,
  AuthorizationUrlRequest,
  AuthenticationResult,
} from "@azure/msal-node";
import config from "#config.js";
import { PKCECodes } from "#types/auth-types.js";
import { Request } from "#node_modules/@types/express/index.js";

export class AuthService {
  public session: SessionData;
  public msalClient: ConfidentialClientApplication;
  private cryptoProvider: CryptoProvider = new CryptoProvider();

  private constructor(
    sessionData: SessionData,
    msalClient: ConfidentialClientApplication,
  ) {
    this.session = sessionData;
    this.msalClient = msalClient;
  }

  public static create(
    sessionData: SessionData,
    msalClient: ConfidentialClientApplication,
  ): AuthService {
    return new AuthService(sessionData, msalClient);
  }

  public async getAuthCodeUrl(session: SessionData): Promise<string> {
    const authCodeUrlRequest: AuthorizationUrlRequest = await this.createAuthCodeRequest(session);

    try {
      return await this.msalClient.getAuthCodeUrl(authCodeUrlRequest);
    } catch (error) {
      throw error;
    }
  }

  public async handleRedirect(authCode: string, requestBody: Request["body"]) {
    if (!this.session.authCodeRequest) {
      throw new Error("Missing auth code request in session");
    }

    this.session.authCodeRequest.code = authCode;

    try {
      const tokenResponse: AuthenticationResult = await this.msalClient.acquireTokenByCode(
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

      return JSON.parse(this.cryptoProvider.base64Decode(requestBody.state));
    } catch (error) {
      throw error;
    }
  }

  public getLogoutUrl(): string {
    return `${config.entra.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${config.entra.postLogoutRedirectUri}`;
  }
  
  private async getPkceCodes(): Promise<PKCECodes> {
    const { verifier, challenge } =
      await this.cryptoProvider.generatePkceCodes();

    return {
      challengeMethod: "S256",
      verifier: verifier,
      challenge: challenge,
    };
  }

  private async createAuthCodeRequest(session: SessionData): Promise<AuthorizationUrlRequest> {
    const scopes: string[] = [];

    const pkceCodes: PKCECodes = await this.getPkceCodes();
    const { challenge, challengeMethod, verifier } = pkceCodes;
    const state: string = this.cryptoProvider.base64Encode(
      JSON.stringify({
        successRedirect: session.returnTo ?? "/",
      }),
    );

    const authCodeUrlRequest: AuthorizationUrlRequest = {
      state: state,
      scopes: scopes,
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
      scopes: scopes,
      redirectUri: config.entra.redirectUri,
    };

    return authCodeUrlRequest;
  }
}
