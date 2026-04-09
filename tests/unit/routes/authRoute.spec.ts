import { AuthService } from '#src/services/authService.js';
import authRouter from '#src/routes/authRoute.js';
import { expect } from 'chai';
import express from 'express';
import session from 'express-session';
import sinon from 'sinon';
import request from 'supertest';

describe('authRoutes', () => {
    let authServiceStub: { getAuthCodeUrl: sinon.SinonStub };
    let app = createApp();
    const AUTH_CODE_URL = 'https://login.microsoftonline.com/auth';

    beforeEach(() => {
        authServiceStub = { getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL) };
        sinon.stub(AuthService, 'create').returns(authServiceStub as unknown as AuthService);
    });

    afterEach(() => sinon.restore());

    describe('GET /auth/signin', () => {
        it('redirects to the URL returned by authService.getAuthCodeUrl()', async () => {

            const response = await request(app).get('/auth/signin');
            expect(response.status).to.equal(302);
            expect(response.headers.location).to.equal(AUTH_CODE_URL);
        });
    });
});


function createApp() {
    const app = express();
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
    app.use('/auth', authRouter);
    return app;
}
