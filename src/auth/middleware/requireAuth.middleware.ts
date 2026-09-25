import type { NextFunction, Request, RequestHandler, Response } from "express";

import { refreshToken } from "#/auth/actions/refreshToken.action.js";
import { destroySessionAuth } from "#/auth/domain/destroySessionAuth.js";
import { destroySessionOffice } from "#/auth/domain/destroySessionOffice.js";
import { getOfficeClaimsFromSession } from "#/auth/domain/getOfficeClaimsFromSession.js";
import { updateSessionAuth } from "#/auth/domain/updateSessionAuth.js";
import { logger } from "#/logger.js";

/**
 * Paths that should bypass authentication checks.
 *
 * These are only auth paths - other routes should just not invoke this middleware.
 */
const IGNORED_AUTH_PATHS = [
  "/auth/signin",
  "/auth/signout",
  "/auth/callback",
  "/auth/refresh",
  // Included here because it's a sort-of auth route, but also a part of Forge which defines a single router for all of its routes.
  "/select-office",
];

/**
 * Authentication middleware to check if the user is authenticated and has a selected office.
 *
 * Having a selected office is essentially an auth check within the scope of RCW
 * since we limit actions based on the office's active schedules.
 *
 * @returns {Function} Middleware function that checks for valid authentication.
 */
export function requireAuth(): RequestHandler {
  // eslint-disable-next-line complexity -- Got a lot of checks to do here.
  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const MS_PER_SECOND = 1000;
      const NOW = Math.floor(Date.now() / MS_PER_SECOND);

      const { session } = req;
      const { id: sessionId } = session;
      const { homeAccountId, idToken } = session.account ?? {};
      const { exp } = session.account?.idTokenClaims ?? {};

      logger.info("requireAuth(): Checking user auth");

      if (IGNORED_AUTH_PATHS.includes(req.originalUrl)) {
        logger.info("requireAuth(): Skipping ignored path");
        next();
        return;
      }

      // Does the user have a valid auth token?
      if (!homeAccountId || !idToken) {
        logger.info("requireAuth(): No auth token");
        destroySessionAuth(session);
        res.redirect("/auth/signin");
        return;
      }

      // Is the token expired?
      if (exp === undefined || exp <= NOW) {
        logger.info("requireAuth(): User auth expired, attempting refresh");
        const result = await refreshToken(homeAccountId, sessionId);

        if (result.error) {
          delete req.session.account;
          res.redirect("/auth/signin");
          return;
        }

        updateSessionAuth(session, result.value);
      }

      // Does the user have a selected office? If not, redirect to the office selection page.
      if (session.selectedOffice === undefined) {
        logger.info("requireAuth(): No selected office");
        if (req.url !== "/select-office") {
          res.redirect("/select-office");
        }
        return;
      }

      // Does the selected office match the user's allowed offices? If not, redirect to the office selection page.
      const allowedOffices = getOfficeClaimsFromSession(session);

      if (!allowedOffices.includes(session.selectedOffice.code)) {
        logger.warn("requireAuth(): Office is not in claims");
        destroySessionOffice(session);
        res.redirect("/select-office");
        return;
      }

      // Add auth to locals for use in templates.
      res.locals.isAuthenticated = true;
      res.locals.user = session.account;

      // User is authenticated and has a valid selected office, carry on.
      logger.debug("requireAuth(): User is authenticated");
      next();
    } catch (error) {
      logger.error("requireAuth(): Error checking user auth", error);
      next(error);
    }
  };
}
