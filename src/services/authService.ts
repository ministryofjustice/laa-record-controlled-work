import { SessionData } from "#node_modules/@types/express-session/index.js";

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

    public getAuthCodeUrl(session: SessionData): string {
        session.authState = 'test';

        return 'https://www.example.com';
    }
}