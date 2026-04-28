import { failure, success } from "#/lib/either.js";
import { AuthService } from "#/services/auth.js";
import sinon from "sinon";
import { createRequest, createResponse } from "node-mocks-http";
import { signIn } from "#/controllers/auth.js";
import type { NextFunction } from "express";
import { expect } from "chai";
import { FOUND, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "#/lib/constants/httpStatus.js";
import { PkceGenerationError } from "#/lib/errors/auth.js";

const AUTH_CODE_URL = "https://login.microsoftonline.com/auth/";

describe("Auth Controller", () => {
  let sandbox: sinon.SinonSandbox;
  let authServiceStub: sinon.SinonStubbedInstance<AuthService>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    authServiceStub = sandbox.createStubInstance(AuthService) as any;
    sandbox.stub(AuthService, "create").returns(authServiceStub as any);
    authServiceStub.getAuthCodeUrl.resolves(success(AUTH_CODE_URL));
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Signin", () => {
    it("will redirect to the url on sucess", async () => {
      const req = createRequest({
        session: {},
      });
      const res = createResponse();
      const nextStub = sinon.stub();
      const next: NextFunction = (err?: unknown) => {
        nextStub(err);
      };
      await signIn(req, res, next);

      const redirectUrl = res._getRedirectUrl();
      expect(redirectUrl).to.equal(AUTH_CODE_URL);
      expect(res.statusCode).to.equal(FOUND);
    });

    it("will return 500 on error", async () => {
      authServiceStub.getAuthCodeUrl.resolves(
        failure(new PkceGenerationError()),
      );

      const req = createRequest({
        session: {},
      });
      const res = createResponse();
      const nextStub = sinon.stub();
      const next: NextFunction = (err?: unknown) => {
        nextStub(err);
      };
      await signIn(req, res, next);

      expect(res.statusCode).to.equal(INTERNAL_SERVER_ERROR);
    });
  });
});

// export const signOut = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): void => {
//   try {
//     const {
//       session: { idToken },
//     } = req;

//     req.session.destroy((error) => {
//       if (error !== undefined && error !== null) {
//         next(error);
//         return;
//       }

//       res.clearCookie(config.expressSession.name);
//       res.redirect(AuthService.getLogoutUrl(idToken));
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const processAuthCodeCallback = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const { success, data } = authCodeResponseSchema.safeParse(req.body);
//     if (!success) {
//       res.status(BAD_REQUEST).send("Invalid redirect payload");
//       return;
//     }

//     const authService = AuthService.create(req.session, msalClient);
//     const result = await authService.processAuthCodeCallback(data);

//     if (result.error instanceof TokenAcquisitionError) {
//       res.status(UNAUTHORIZED).send(result.error.message);
//       return;
//     } else if (result.error) {
//       res.status(BAD_REQUEST).send(result.error.message);
//       return;
//     }

//     const { isAuthenticated, idToken, account, tokenCache } = req.session;
//     req.session.regenerate((error) => {
//       if (error !== undefined && error !== null) {
//         next(error);
//         return;
//       }

//       req.session.isAuthenticated = isAuthenticated;
//       req.session.idToken = idToken;
//       req.session.account = account;
//       req.session.tokenCache = tokenCache;
//       res.redirect(result.value);
//     });
//   } catch (error) {
//     res.redirect("/auth/signin");
//   }
// };
