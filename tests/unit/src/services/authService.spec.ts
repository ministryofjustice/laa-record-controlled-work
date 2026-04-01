import { AuthServiceFactory } from '#src/services/authService.js';
import { expect } from 'chai';
import { SessionData } from 'express-session';
import sinon, { SinonStubbedInstance } from 'sinon';

// class TestAuthService extends AuthService {

// }
class ConfidentialClientApplication {

}
// describe('AuthServiceFactory', () => {
//     describe('createAuthService', () => {
//         it('should return an authService', () => {

//         })
//     })
// })

describe('AuthService', () => {
    describe('Returns an Auth Code', () => {

        const authServiceFactory = new AuthServiceFactory();

        it('should store a state in session', () => {
            const session = '';
            process.env.CLOUD_INSTANCE = 'myCloudInstance';
            process.env.TENANT_ID = 'myTenantId';

            // let confidentialClientApplication: SinonStubbedInstance<ConfidentialClientApplication>;
            // confidentialClientApplication = sinon.createStubInstance(ConfidentialClientApplication);

            let sessionData = {} as SessionData;


            const authService = authServiceFactory.createAuthService(/* confidentialClientApplication, */ sessionData);

            authService.getAuthCodeUrl(sessionData);
            expect(sessionData.authState).not.to.be.eq('');
        })

        it('should return a URL', async () => {
            const session = '';
            // process.env.CLOUD_INSTANCE = 'myCloudInstance';
            // process.env.TENANT_ID = 'myTenantId';

            // let confidentialClientApplication: SinonStubbedInstance<ConfidentialClientApplication>;
            // confidentialClientApplication = sinon.createStubInstance(ConfidentialClientApplication);

            let sessionData = {} as SessionData;

            const authService = authServiceFactory.createAuthService(/* confidentialClientApplication */ sessionData);
            const url = await authService.getAuthCodeUrl(sessionData)
            expect(url).to.be.eq('myCloudInstance/myTenantId/oauth2/v2.0/authorize');
        })
    })

    describe('Returns a Logout Url', () => {

        const authServiceFactory = new AuthServiceFactory();

        it('should return a Logout Url', () => {
            const session = '';
            process.env.CLOUD_INSTANCE = 'myCloudInstance';
            process.env.TENANT_ID = 'myTenantId';
            process.env.POST_LOGOUT_REDIRECT_URI = 'myPostLogoutUri';

            // let confidentialClientApplication: SinonStubbedInstance<ConfidentialClientApplication>;
            // confidentialClientApplication = sinon.createStubInstance(ConfidentialClientApplication);

            let sessionData = {} as SessionData;

            const authService = authServiceFactory.createAuthService(/* confidentialClientApplication */ sessionData);

            expect(authService.getLogoutUrl()).to.be.eq('myCloudInstance/myTenantId/oauth2/v2.0/logout?post_logout_redirect_uri=myPostLogoutUri');
        })
    })
})