import config from "#config.js";
import { msalConfig } from "#src/config/auth.js";
import { AuthService } from "#src/services/auth.js";
import { authCodeResponseSchema } from "#types/auth-types.js";
import { mapAuthErrorToHttp } from "#types/auth-errors.js";
import { ConfidentialClientApplication } from "@azure/msal-node";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

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
      const result = await authService.getAuthCodeUrl();
      if (result.isFailure()) {
        const { status, message } = mapAuthErrorToHttp(result.value);
        return res.status(status).send(message);
      }

      res.redirect(result.value);
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
      const parseResult = authCodeResponseSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).send("Invalid redirect payload");
      }

      const { data } = parseResult;
      const authService = AuthService.create(req.session, msalClient);
      const result = await authService.processAuthCodeCallback(data);

      if (result.isFailure()) {
        const { status, message } = mapAuthErrorToHttp(result.value);
        return res.status(status).send(message);
      }

      const { successRedirect } = result.value;
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
        res.redirect(successRedirect);
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
