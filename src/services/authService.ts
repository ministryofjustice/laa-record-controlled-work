import { SessionData } from "#node_modules/@types/express-session/index.js";
import { ConfidentialClientApplication, Configuration, CryptoProvider, AuthorizationUrlRequest, AuthorizationCodeRequest, AuthenticationResult } from '@azure/msal-node';
import config from "#config.js";
import { PKCECodes } from "#types/auth-types.js";


export class AuthService {
    public session: SessionData;
    public msalClient: ConfidentialClientApplication;
    private cryptoProvider: CryptoProvider = new CryptoProvider();

    private msalConfig: Configuration = {
        auth: {
            clientId: `${config.entra.clientId}`,
            authority: `${config.entra.authority}`,
            clientSecret: `${config.entra.clientSecret}`
        },
        system: {},
    };

    private constructor(sessionData: SessionData, msalClient: ConfidentialClientApplication) {
        this.session = sessionData;
        this.msalClient = msalClient
    }

    public static create(sessionData: SessionData, msalClient: ConfidentialClientApplication): AuthService {
        return new AuthService(sessionData, msalClient);
    }

    private async getPkceCodes(): Promise<PKCECodes> {
        // Generate PKCE Codes before starting the authorization flow
        const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

        return {
            challengeMethod: 'S256',
            verifier: verifier,
            challenge: challenge,
        };
    }

    protected createAndStoreState(session: SessionData): string {
        session.csrfToken = this.cryptoProvider.createNewGuid();

        session.authState = this.cryptoProvider.base64Encode(
            JSON.stringify({
                csrfToken: session.csrfToken,
                redirectTo: '/',
            })
        );

        return session.authState;
    }

    public async getAuthCodeUrl(session: SessionData): Promise<string> {
        const authCodeUrlRequestParams = {
            state: this.createAndStoreState(session),
            scopes: []
        };

        // Set generated PKCE codes and method as session vars
        session.pkceCodes = await this.getPkceCodes();

        const authCodeUrlRequest: AuthorizationUrlRequest = {
            ...authCodeUrlRequestParams,
            redirectUri: config.entra.redirectUri,
            responseMode: 'form_post', // recommended for confidential clients
            codeChallenge: session.pkceCodes.challenge,
            codeChallengeMethod: session.pkceCodes.challengeMethod,
        };

        try {
            return await this.msalClient.getAuthCodeUrl(authCodeUrlRequest);
        } catch (error) {
            throw error;
        }
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