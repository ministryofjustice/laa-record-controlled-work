import config from "#config.js";
import { msalClient } from "#src/config/auth.js";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#src/lib/constants/httpStatus.js";
import { TokenAcquisitionError } from "#src/lib/errors/auth.js";
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
    const authService = AuthService.create(req.session, msalClient);

    try {
      const result = await authService.getAuthCodeUrl();
      if (result.error) {
        const { message } = result.error;
        return res.status(INTERNAL_SERVER_ERROR).send(message);
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

    req.session.destroy((error) => {
      if (error !== undefined && error !== null) {
        next(error);
        return;
      }

      res.clearCookie(config.expressSession.name);
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
      const { success, data } = authCodeResponseSchema.safeParse(req.body);
      if (!success) {
        return res.status(BAD_REQUEST).send("Invalid redirect payload");
      }

      const authService = AuthService.create(req.session, msalClient);
      const result = await authService.processAuthCodeCallback(data);

      if (result.error instanceof TokenAcquisitionError) {
        return res.status(UNAUTHORIZED).send(result.error.message);
      } else if (result.error) {
        return res.status(BAD_REQUEST).send(result.error.message);
      }

      const { isAuthenticated, idToken, account, tokenCache } = req.session;
      req.session.regenerate((error) => {
        if (error !== undefined && error !== null) {
          next(error);
          return;
        }

        req.session.isAuthenticated = isAuthenticated;
        req.session.idToken = idToken;
        req.session.account = account;
        req.session.tokenCache = tokenCache;
        res.redirect(result.value);
      });
    } catch (error) {
      res.redirect("/auth/signin");
    }
  },
);

export default router;
