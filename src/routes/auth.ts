import config from "#config.js";
import { msalConfig } from "#src/config/auth.js";
import { AuthService } from "#src/services/auth.js";
import { authCodeResponseSchema } from "#types/auth-types.js";
import { mapAuthErrorToHttp } from "#src/lib/authErrors.js";
import { ConfidentialClientApplication } from "@azure/msal-node";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { BAD_REQUEST } from "#src/constants/httpStatus.js";

const router: Router = Router();
const msalClient: ConfidentialClientApplication =
  new ConfidentialClientApplication(msalConfig);

router.get(
  "/signin",
  async (req: Request, res: Response, next: NextFunction) => {
    const authService: AuthService = AuthService.create(
      req.session,
      msalClient,
    );

    try {
      const authCodeUrl = await authService.getAuthCodeUrl();
      if (authCodeUrl.isFailure()) {
        const { status, message } = mapAuthErrorToHttp(authCodeUrl.value);
        return res.status(status).send(message);
      }

      res.redirect(authCodeUrl.value);
    } catch (error) {
      next(error);
    }
  },
);

router.post("/signout", (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      session: { idToken },
    } = req;
    req.session.destroy((error: Error | undefined) => {
      if (error !== undefined) {
        next(error);
        return;
      }

      res.clearCookie(config.session.name);
      res.redirect(AuthService.getLogoutUrl(idToken));
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/code/callback",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseAuthCodeResponse = authCodeResponseSchema.safeParse(req.body);
      if (!parseAuthCodeResponse.success) {
        return res.status(BAD_REQUEST).send("Invalid redirect payload");
      }

      const { data } = parseAuthCodeResponse;
      const authService = AuthService.create(req.session, msalClient);
      const sucessfulRedirect = await authService.processAuthCodeCallback(data);

      if (sucessfulRedirect.isFailure()) {
        const { status, message } = mapAuthErrorToHttp(sucessfulRedirect.value);
        return res.status(status).send(message);
      }

      const { isAuthenticated, idToken, account, tokenCache } = req.session;
      req.session.regenerate((error) => {
        if (error !== undefined) {
          next(error);
          return;
        }
        req.session.isAuthenticated = isAuthenticated;
        req.session.idToken = idToken;
        req.session.account = account;
        req.session.tokenCache = tokenCache;
        res.redirect(sucessfulRedirect.value);
      });
    } catch (error) {
      res.redirect("/auth/signin");
    }
  },
);

export default router;
