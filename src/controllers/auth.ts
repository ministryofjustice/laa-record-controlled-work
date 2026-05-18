import type { NextFunction, Request, Response } from "express";

// TODO: this is a handlers module, rather than controller
import config from "#/config.js";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#/lib/constants/httpStatus.js";
import { TokenAcquisitionError } from "#/lib/errors/auth.js";
import { AuthService } from "#/services/auth.js";
import { authCodeResponseSchema } from "#/types/auth-types.js";

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authService = AuthService.create(req.session);
  try {
    const result = await authService.getAuthCodeUrl();
    if (result.error) {
      res.status(INTERNAL_SERVER_ERROR).send(result.error.message);
      return;
    }

    req.session.save((err: Error | undefined) => {
      if (err) {
        next(err);
        return;
      }
      res.redirect(result.value);
    });
  } catch (error) {
    next(error);
  }
};

export const processAuthCodeCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { success, data } = authCodeResponseSchema.safeParse(req.query);

    if (!success) {
      res.status(BAD_REQUEST).send("Invalid redirect payload");
      return;
    }

    const authService = AuthService.create(req.session);
    const result = await authService.processAuthCodeCallback(data);

    if (result.error instanceof TokenAcquisitionError) {
      res.status(UNAUTHORIZED).send(result.error.message);
      return;
    } else if (result.error) {
      res.status(BAD_REQUEST).send(result.error.message);
      return;
    }

    const { account, idToken, isAuthenticated, tokenCache } = req.session;

    req.session.regenerate((error: Error | null | undefined) => {
      if (error) {
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
    next(error);
    // TODO how to handle??
  }
};

export const signOut = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const {
      session: { idToken },
    } = req;

    req.session.destroy((error) => {
      if (error !== undefined && error !== null) {
        next(error);
        return;
      }

      res.clearCookie(config.session.name);
      res.redirect(AuthService.getLogoutUrl(idToken));
    });
  } catch (error) {
    next(error);
  }
};
