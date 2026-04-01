import config from '#config.js';
import { ConfidentialClientApplication } from '#node_modules/@azure/msal-node/dist/client/ConfidentialClientApplication.js';
import { AuthServiceFactory } from '#src/services/authService.js';
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
    describe('Returns an Auth Code', () => {

        const authServiceFactory = new AuthServiceFactory();

        it('should store a state in session', () => {
            const session = '';
            process.env.CLOUD_INSTANCE = 'myCloudInstance';
            process.env.TENANT_ID = 'myTenantId';

            const test = {
                getAuthCodeUrl: sinon.stub().returns("test")
            } as unknown as ConfidentialClientApplication

            let sessionData = {} as SessionData;


            const authService = authServiceFactory.createAuthService(sessionData, test);

            authService.getAuthCodeUrl(sessionData);
            expect(sessionData.authState).not.to.be.eq('');
        })

        it('should return a URL', async () => {

            const stub = {
                getAuthCodeUrl: sinon.stub().returns("test")
            } as unknown as ConfidentialClientApplication

            let sessionData = {} as SessionData;

            const authService = authServiceFactory.createAuthService(sessionData, stub);
            const url = await authService.getAuthCodeUrl(sessionData)
            expect(url).to.include('test');
        })
    })


    // describe('getTokenByCode returns Token'), () => {

    //     const authServiceFactory = new AuthServiceFactory();
    //     let sessionData = {} as SessionData;

    //     it('Should return an access token'), () => {

    //         const authService = authServiceFactory.createAuthService(sessionData);
    //         const authCode = ""
    //         const token = authService.getTokenByCode(authCode)
    //         // mock out MSAL 

    //         expect(token).to.eq("accessToken")
    //     }
    // }

    // describe('Returns a Logout Url', () => {

    //     const authServiceFactory = new AuthServiceFactory();

    //     it('should return a Logout Url', () => {
    //         const session = '';
    //         process.env.CLOUD_INSTANCE = 'myCloudInstance';
    //         process.env.TENANT_ID = 'myTenantId';
    //         process.env.POST_LOGOUT_REDIRECT_URI = 'myPostLogoutUri';

    //         // let confidentialClientApplication: SinonStubbedInstance<ConfidentialClientApplication>;
    //         // confidentialClientApplication = sinon.createStubInstance(ConfidentialClientApplication);

    //         let sessionData = {} as SessionData;

    //         const authService = authServiceFactory.createAuthService(/* confidentialClientApplication */ sessionData);

    //         expect(authService.getLogoutUrl()).to.be.eq('myCloudInstance/myTenantId/oauth2/v2.0/logout?post_logout_redirect_uri=myPostLogoutUri');
    //     })
    // })
})