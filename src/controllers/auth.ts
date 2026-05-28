import type { NextFunction, Request, Response } from "express";

// TODO: this is a handlers module, rather than controller
import config from "#/config.js";
import {
  isAllowedRelayTarget,
  parseRelayState,
  verifyRelayState,
} from "#/lib/auth.relay.js";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#/lib/constants/httpStatus.js";
import { TokenAcquisitionError } from "#/lib/errors/auth.js";
import { AuthService } from "#/services/auth.js";
import { authCodeResponseSchema } from "#/services/auth.types.js";

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authService = AuthService.create(req.session, req.hostname);
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
    const { data, success } = authCodeResponseSchema.safeParse(req.query);
    if (!success) {
      res.status(BAD_REQUEST).send("Invalid redirect payload");
      return;
    }

    // Relay detection: if the state encodes a callback target for an ephemeral host,
    // validate the signature and forward the callback to that ephemeral environment.
    const relayState = parseRelayState(data.state);
    if (relayState !== null) {
      const { target } = relayState;
      if (
        !verifyRelayState(relayState, config.session.secret) ||
        !isAllowedRelayTarget(target)
      ) {
        res.status(BAD_REQUEST).send("Invalid relay target");
        return;
      }

      const targetUrl = new URL(target);
      if (targetUrl.hostname !== req.hostname) {
        targetUrl.pathname = "/auth/code/callback";
        targetUrl.searchParams.set("code", data.code);
        targetUrl.searchParams.set("state", data.state);

        console.info(`Relaying auth callback to ${targetUrl.hostname}`);
        res.set("Cache-Control", "no-store");
        res.redirect(targetUrl.toString());
        return;
      }
    }

    const authService = AuthService.create(req.session, req.hostname);
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
    req.session.destroy((error: Error | null) => {
      if (error) {
        next(error);
        return;
      }

      res.clearCookie(config.session.name);
      res.redirect("/");
    });
  } catch (error) {
    next(error);
  }
};
