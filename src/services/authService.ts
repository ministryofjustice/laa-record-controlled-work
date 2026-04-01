import { SessionData } from "#node_modules/@types/express-session/index.js";
import { randomUUID } from 'crypto';
import { ConfidentialClientApplication, Configuration, CryptoProvider, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node';
import config from "#config.js";

export class AuthServiceFactory {
    public createAuthService(session: SessionData): AuthService {
        return new AuthService(session);
    }
}

export class AuthService {
    public session: SessionData;
    private cryptoProvider: CryptoProvider = new CryptoProvider();

    private msalConfig: Configuration = {
        auth: {
            clientId: `${config.entra.clientId}`,
            authority: `${config.entra.authority}`,
            clientSecret: `${config.entra.clientSecret}`
        },
        system: {},
    };


    constructor(sessionData: SessionData) {
        this.session = sessionData;
    }

    private getMsalInstance(msalConfig: Configuration) {
        return new ConfidentialClientApplication(msalConfig);
    }

    private async getPkceCodes(): Promise<Record<string, string>> {
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

        const msal = this.getMsalInstance(this.msalConfig);

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
            return await msal.getAuthCodeUrl(authCodeUrlRequest);
        } catch (error) {
            throw error;
        }
    }

    public getLogoutUrl(): string {
        return `${process.env.CLOUD_INSTANCE}/${process.env.TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${process.env.POST_LOGOUT_REDIRECT_URI}`;
    }
}