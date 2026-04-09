import { ConfidentialClientApplication, CryptoProvider } from '@azure/msal-node';
import { AuthService } from '#src/services/authService.js';
import { expect } from 'chai';
import type { SessionData } from 'express-session';
import sinon from 'sinon';

describe('AuthService', () => {
    let msalStub: Partial<ConfidentialClientApplication>;
    let session: SessionData;
    const AUTH_CODE_URL = 'https://login.microsoftonline.com/auth';
    let service: AuthService;

    beforeEach(() => {
        msalStub = {
            getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL),
        };

        session = {} as SessionData;
        service = AuthService.create(session, msalStub as ConfidentialClientApplication);

        sinon.stub(CryptoProvider.prototype, 'generatePkceCodes').resolves({
            verifier: 'test-verifier',
            challenge: 'test-challenge',
        });

        sinon.stub(CryptoProvider.prototype, 'base64Encode').returns('encoded-state');
    });

    afterEach(() => sinon.restore());

    describe('getAuthCodeUrl()', () => {

        it('returns a URL from the MSAL client', async () => {
            const url = await service.getAuthCodeUrl(session);
            expect(url).to.equal(AUTH_CODE_URL);
        });

        it('stores PKCE codes on session', async () => {
            await service.getAuthCodeUrl(session);
            expect(session.pkceCodes).to.exist;
            expect(session.pkceCodes?.verifier).to.equal('test-verifier');
            expect(session.pkceCodes?.challenge).to.equal('test-challenge');
        });

        it('stores authCodeUrlRequest and authCodeRequest on session', async () => {
            await service.getAuthCodeUrl(session);
            expect(session.authCodeUrlRequest).to.exist;
            expect(session.authCodeRequest).to.exist;
        });

        it('encodes successRedirect into the state parameter', async () => {
            await service.getAuthCodeUrl(session);
            const base64Encode = CryptoProvider.prototype.base64Encode as sinon.SinonStub;
            expect(JSON.parse(base64Encode.firstCall.args[0])).to.deep.equal({ successRedirect: '/' });
        });

        it('passes responseMode: "form_post" and PKCE challenge to MSAL', async () => {
            await service.getAuthCodeUrl(session);
            const [requestArg] = (msalStub.getAuthCodeUrl as sinon.SinonStub).args[0];
            expect(requestArg.responseMode).to.equal('form_post');
            expect(requestArg.codeChallenge).to.equal('test-challenge');
        });
    });

    describe('handleRedirect()', () => {
        beforeEach(() => {
            session.authCodeRequest = { code: '', codeVerifier: 'test-verifier', scopes: [], redirectUri: 'http://localhost/auth/redirect' };
            session.pkceCodes = { verifier: 'test-verifier', challenge: 'test-challenge', challengeMethod: 'S256' };
            msalStub.acquireTokenByCode = sinon.stub().resolves({ account: { username: 'user' }, idToken: 'id-token' });
        });

        it('calls acquireTokenByCode with authCodeRequest from session plus the code', async () => {
            await service.handleRedirect('auth-code', {});
            const [requestArg] = (msalStub.acquireTokenByCode as sinon.SinonStub).args[0];
            expect(requestArg.code).to.equal('auth-code');
            expect(requestArg.codeVerifier).to.equal('test-verifier');
        });
    });
});