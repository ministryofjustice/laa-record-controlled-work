import config from "#config.js";
import { msalClient } from "#src/config/auth.js";
import { BAD_REQUEST } from "#src/constants/httpStatus.js";
import { AuthService } from "#src/services/auth.js";
import { authCodeResponseSchema } from "#types/auth-types.js";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

const router: Router = Router();

router.get(
  "/signin",
  async (req: Request, res: Response, next: NextFunction) => {
    const authService: AuthService = AuthService.create(
      req.session,
      msalClient,
    );

    try {
      const authUrl: string = await authService.getAuthCodeUrl();

      res.redirect(authUrl);
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
        return res.status(BAD_REQUEST).send("Invalid redirect payload");
      }

      const { data } = parseResult;
      const authService = AuthService.create(req.session, msalClient);
      const { successRedirect } =
        await authService.processAuthCodeCallback(data);

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
      res.redirect("/auth/signin");
    }
  },
);

export default router;
