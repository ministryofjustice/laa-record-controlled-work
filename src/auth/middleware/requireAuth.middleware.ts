import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { SessionData } from "express-session";

import { refreshAuthToken } from "#/auth/actions/refreshAuthToken.action.js";
import { AuthenticationError } from "#/auth/auth.errors.js";
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

      logger.debug("requireAuth(): Checking user auth");

      if (IGNORED_AUTH_PATHS.includes(req.originalUrl)) {
        logger.debug("requireAuth(): Skipping ignored path");
        next();
      }

      // Does the user have a valid auth token?
      // TODO We should decode the ID Token and check against the decoded claims instead of relying on the session data, but this is fine until we can implement that.
      if (homeAccountId === undefined || idToken === undefined) {
        logger.debug("requireAuth(): No auth token");
        delete req.session.account;
        res.redirect("/auth/signin");
        return;
      }

      // Is the token expired?
      if (exp === undefined || exp <= NOW) {
        logger.debug("requireAuth(): User auth expired, attempting refresh");
        await refreshAuthToken(homeAccountId, sessionId);
        return;
      }

      // Does the user have a selected office? If not, redirect to the office selection page.
      if (session.selectedOffice === undefined) {
        logger.debug("requireAuth(): No selected office");
        if (req.url !== "/select-office") {
          res.redirect("/select-office");
        }
        return;
      }

      // Does the selected office match the user's allowed offices? If not, redirect to the office selection page.
      const allowedOffices = getOfficeClaimsFromSession(session);

      if (!allowedOffices.includes(session.selectedOffice.code)) {
        logger.warn("requireAuth(): Office is not in claims");
        res.redirect("/select-office");
        return;
      }

      // User is authenticated and has a valid selected office, carry on.
      logger.debug("requireAuth(): User is authenticated");
      next();
    } catch (error) {
      logger.error("requireAuth(): Error checking user auth", error);
      next(error);
    }
  };
}

/**
 * Get the list of office codes from the idTokenClaims.
 *
 * @param session The request session.
 * @returns List of office codes.
 */
function getOfficeClaimsFromSession(session: SessionData): string[] {
  const offices = session.account?.idTokenClaims?.LAA_ACCOUNTS;

  if (Array.isArray(offices)) {
    return offices;
  }

  if (typeof offices === "string") {
    return [offices];
  }

  throw new AuthenticationError(
    "Invalid LAA_ACCOUNTS claim, expected string or string[]",
  );
}
