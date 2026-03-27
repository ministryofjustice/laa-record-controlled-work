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

        it ('should store a state in session', () => {
            const session = '';

            // let confidentialClientApplication: SinonStubbedInstance<ConfidentialClientApplication>;
            // confidentialClientApplication = sinon.createStubInstance(ConfidentialClientApplication);

            let sessionData = {} as SessionData;
            

            const authService = authServiceFactory.createAuthService(/* confidentialClientApplication, */ sessionData);

            authService.getAuthCodeUrl(sessionData);
            expect(sessionData.authState).not.to.be.eq('');
        })

        it ('should return a URL', () => {
            const session = '';

            // let confidentialClientApplication: SinonStubbedInstance<ConfidentialClientApplication>;
            // confidentialClientApplication = sinon.createStubInstance(ConfidentialClientApplication);

            let sessionData = {} as SessionData;

            const authService = authServiceFactory.createAuthService(/* confidentialClientApplication */ sessionData);

            expect(authService.getAuthCodeUrl(sessionData)).to.be.eq('https://www.example.com');
        })
    })
})