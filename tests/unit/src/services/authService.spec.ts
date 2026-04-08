import config from '#config.js';
import { ConfidentialClientApplication } from '#node_modules/@azure/msal-node/dist/client/ConfidentialClientApplication.js';
import { AuthService } from '#src/services/authService.js';
import { expect } from 'chai';
import { SessionData } from 'express-session';
import sinon, { SinonStubbedInstance } from 'sinon';

// class TestAuthService extends AuthService {

// }
// describe('AuthServiceFactory', () => {
//     describe('createAuthService', () => {
//         it('should return an authService', () => {

//         })
//     })
// })

describe('AuthService', () => {

    let msalStub: Partial<ConfidentialClientApplication>;
    let sessionData: SessionData;

    beforeEach(() => {
        msalStub = {
            getAuthCodeUrl: sinon.stub().returns("test"),
            acquireTokenByCode: sinon.stub().returns("test")
        };
        sessionData = {} as SessionData;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Returns an Auth Code', () => {
        it('should store a state in session', () => {
            process.env.CLOUD_INSTANCE = 'myCloudInstance';
            process.env.TENANT_ID = 'myTenantId';

            const authService = AuthService.create(sessionData, msalStub as ConfidentialClientApplication);

            authService.getAuthCodeUrl(sessionData);
            expect(sessionData.authState).not.to.be.eq('');
        })

        it('should return a URL', async () => {
            const authService = AuthService.create(sessionData, msalStub as ConfidentialClientApplication);
            const url = await authService.getAuthCodeUrl(sessionData)
            expect(url).to.include('test');
        })
    })

    describe('getTokenByCode returns Token'), () => {
        it('Should return an access token'), () => {
            const authService = AuthService.create(sessionData, msalStub as ConfidentialClientApplication);
            const authCode = ""

            // const token = authService.getTokenByCode(authCode)

            // expect(token).to.eq("accessToken")
        }
    }

    describe('Returns a Logout Url', () => {
        it('should return a Logout Url', () => {
            process.env.CLOUD_INSTANCE = 'myCloudInstance';
            process.env.TENANT_ID = 'myTenantId';
            process.env.POST_LOGOUT_REDIRECT_URI = 'myPostLogoutUri';

            const authService = AuthService.create(sessionData, msalStub as ConfidentialClientApplication);
            expect(authService.getLogoutUrl()).to.be.eq('myCloudInstance/myTenantId/oauth2/v2.0/logout?post_logout_redirect_uri=myPostLogoutUri');
        })
    })
})