import config from "#config.js";
import { BAD_REQUEST } from "#src/constants/httpStatus.js";
import { msalConfig } from "#src/config/auth.js";
import { AuthService } from "#src/services/auth.js";
import { authCodeResponseSchema } from "#types/auth-types.js";
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
    try {
      const authService: AuthService = AuthService.create(
        req.session,
        msalClient,
      );
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
      res.redirect(successRedirect);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
