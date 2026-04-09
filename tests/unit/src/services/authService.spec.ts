import { ConfidentialClientApplication, CryptoProvider } from '@azure/msal-node';
import { AuthService } from '#src/services/authService.js';
import { expect } from 'chai';
import type { SessionData } from 'express-session';
import sinon from 'sinon';

describe('AuthService', () => {
    let msalStub: Partial<ConfidentialClientApplication>;
    let session: SessionData;
    const AUTH_CODE_URL = 'https://login.microsoftonline.com/auth';

    beforeEach(() => {
        msalStub = {
            getAuthCodeUrl: sinon.stub().resolves(AUTH_CODE_URL),
        };
        session = {} as SessionData;
    });

    afterEach(() => sinon.restore());

    describe('getAuthCodeUrl()', () => {
        beforeEach(() => {
            sinon.stub(CryptoProvider.prototype, 'generatePkceCodes').resolves({
                verifier: 'test-verifier',
                challenge: 'test-challenge',
            });
            sinon.stub(CryptoProvider.prototype, 'base64Encode').returns('encoded-state');
        });

        it('returns a URL from the MSAL client', async () => {
            const service = AuthService.create(session, msalStub as ConfidentialClientApplication);
            const url = await service.getAuthCodeUrl(session);
            expect(url).to.equal(AUTH_CODE_URL);
        });
    });
});