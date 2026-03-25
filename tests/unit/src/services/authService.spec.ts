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
    it ('should store a state in session.authState', () => {
        const session = '';

        let confidentialClientApplication: SinonStubbedInstance<ConfidentialClientApplication>;
        confidentialClientApplication = sinon.createStubInstance(ConfidentialClientApplication);

        let sessionData = {} as SessionData;
        
        const authService = createAuthService(confidentialClientApplication, sessionData);

        expect(authService.getAuthCode(sessionData)).to.be('https://www.example.com');
    })
})