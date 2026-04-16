import config from "#config.js";
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

router.get(
  "/signin",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const msalClient: ConfidentialClientApplication =
        new ConfidentialClientApplication(msalConfig);
      const authService: AuthService = AuthService.create(
        req.session,
        msalClient,
      );
      const authUrl: string = await authService.getAuthCodeUrl(req.session);
      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/signout", (req: Request, res: Response, next: NextFunction) => {
  try {
    req.session.destroy(() => {
      res.redirect(AuthService.getLogoutUrl());
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/redirect",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = authCodeResponseSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res
          .status(config.HTTP_STATUS.BAD_REQUEST)
          .send("Invalid redirect payload");
      }

      const { data } = parseResult;
      const msalClient = new ConfidentialClientApplication(msalConfig);
      const authService = AuthService.create(req.session, msalClient);
      const { successRedirect } = await authService.handleRedirect(data);
      res.redirect(successRedirect);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
