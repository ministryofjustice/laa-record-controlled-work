import { SessionData } from "#node_modules/@types/express-session/index.js";
import { ConfidentialClientApplication, Configuration, CryptoProvider, AuthorizationUrlRequest, AuthorizationCodeRequest, AuthenticationResult } from '@azure/msal-node';
import config from "#config.js";
import { PKCECodes } from "#types/auth-types.js";


export class AuthService {
    public session: SessionData;
    public msalClient: ConfidentialClientApplication;
    private cryptoProvider: CryptoProvider = new CryptoProvider();

    private constructor(sessionData: SessionData, msalClient: ConfidentialClientApplication) {
        this.session = sessionData;
        this.msalClient = msalClient
    }

    public static create(sessionData: SessionData, msalClient: ConfidentialClientApplication): AuthService {
        return new AuthService(sessionData, msalClient);
    }

    public async getAuthCodeUrl(session: SessionData): Promise<string> {

        const authCodeUrlRequest = await this.createAuthCodeRequest(session);

        try {
            return await this.msalClient.getAuthCodeUrl(authCodeUrlRequest);
        } catch (error) {
            throw error;
        }
    }

    private async getPkceCodes(): Promise<PKCECodes> {
        const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

        return {
            challengeMethod: 'S256',
            verifier: verifier,
            challenge: challenge,
        };
    }

    private async createAuthCodeRequest(session: SessionData) {

        const scopes: string[] = [];

        const pkceCodes = await this.getPkceCodes();
        session.pkceCodes = pkceCodes;
        const { challenge, challengeMethod, verifier } = pkceCodes;

        const authCodeUrlRequestParams = {
            state: this.cryptoProvider.base64Encode(
                JSON.stringify({
                    successRedirect: "/",
                })),
            scopes: scopes
        };

        const authCodeUrlRequest: AuthorizationUrlRequest = {
            ...authCodeUrlRequestParams,
            redirectUri: config.entra.redirectUri,
            responseMode: 'form_post',
            codeChallenge: challenge,
            codeChallengeMethod: challengeMethod,
        };

        const authCodeRequest: AuthorizationCodeRequest = {
            code: "",
            codeVerifier: verifier,
            scopes: scopes,
            redirectUri: config.entra.redirectUri,
        };
        session.authCodeUrlRequest = authCodeUrlRequest;
        session.authCodeRequest = authCodeRequest;

        return authCodeUrlRequest;
    }


    // public async getTokenByCode(session: SessionData, authCode: string): Promise<AuthenticationResult> {
    //     if (!session.pkceCodes) {
    //         throw new Error('Missing PKCE codes');
    //     }

    //     const authCodeRequest: AuthorizationCodeRequest = {
    //             ...session.authCodeRequest,
    //             code: authCode,
    //             codeVerifier: session.pkceCodes.verifier,
    //         };
    //     return await this.msalClient.acquireTokenByCode(authCodeRequest, req.body);
    // }

    public getLogoutUrl(): string {
        return `${process.env.CLOUD_INSTANCE}/${process.env.TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${process.env.POST_LOGOUT_REDIRECT_URI}`;
    }
}