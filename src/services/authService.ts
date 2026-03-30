import { SessionData } from "#node_modules/@types/express-session/index.js";
import { randomUUID } from 'crypto';
import '@azure/msal-node';

export class AuthServiceFactory {
    public createAuthService(session: SessionData): AuthService {
        return new AuthService(session);
    }
}

export class AuthService {
    public session: SessionData;

    constructor(sessionData: SessionData) {
        this.session = sessionData;
    }

    protected createAndStoreState(session: SessionData): string {
        session.authState = randomUUID().toString();
        return session.authState;
    }

    public generateAuthCodeUrl(session: SessionData): string {
        this.createAndStoreState(session);

        return `${process.env.CLOUD_INSTANCE}/${process.env.TENANT_ID}/oauth2/v2.0/authorize`;
    }

    public generateLogoutUrl(): string {
        return `${process.env.CLOUD_INSTANCE}/${process.env.TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${process.env.POST_LOGOUT_REDIRECT_URI}`;
    }
}