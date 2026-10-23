import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AuthError } from "@azure/msal-node";
import { promisify } from "node:util";

import { refreshToken } from "#/auth/actions/refreshToken.action.js";
import { destroySessionAuth } from "#/auth/domain/destroySessionAuth.js";
import { destroySessionOffice } from "#/auth/domain/destroySessionOffice.js";
import { EntraErrorCode } from "#/auth/domain/EntraErrorCode.enum.js";
import { getOfficeClaimsFromSession } from "#/auth/domain/getOfficeClaimsFromSession.js";
import { updateSessionAuth } from "#/auth/domain/updateSessionAuth.js";
import { deleteMsalCache, setMsalCacheExpiry } from "#/auth/msal.cache.js";
import {
  hasValidLifecycle,
  lifecycleExpiresAt,
  renewLifecycle,
} from "#/auth/session.lifecycle.js";
import config from "#/config.js";
import { FORBIDDEN, HTTP_STATUS } from "#/lib/constants/http.js";
import { SECOND } from "#/lib/constants/time.js";
import { logger } from "#/logger.js";

/**
 * Paths that should bypass authentication checks.
 *
 * These are only auth paths - other routes should just not invoke this middleware.
 */
const IGNORED_AUTH_PATHS = ["/auth/signin", "/auth/signout", "/auth/callback"];

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
      const now = Date.now();

      const { session } = req;
      const { id: sessionId } = session;
      const { homeAccountId, idToken } = session.account ?? {};
      const { exp } = session.account?.idTokenClaims ?? {};
      let sessionExpiresAt: number | undefined;

      logger.info("requireAuth(): Checking user auth");

      if (IGNORED_AUTH_PATHS.includes(req.originalUrl)) {
        logger.info("requireAuth(): Skipping ignored path");
        next();
        return;
      }

      if (session.account !== undefined) {
        if (
          !hasValidLifecycle(session, now) ||
          lifecycleExpiresAt(session) <= now
        ) {
          const destroy = promisify(
            (callback: (error?: Error | null) => void): void => {
              session.destroy(callback);
            },
          );
          await destroy();

          res.clearCookie(config.session.name);
          await deleteMsalCache(sessionId);
          res.redirect("/auth/signin?prompt=login");
          return;
        }

        sessionExpiresAt = renewLifecycle(session, now);
        await setMsalCacheExpiry(sessionId, sessionExpiresAt);
      }

      // Does the user have a valid auth token?
      if (!homeAccountId || !idToken) {
        logger.info("requireAuth(): No auth token");
        destroySessionAuth(session);
        destroySessionOffice(session);
        res.redirect("/auth/signin");
        return;
      }

      // Is the token expired?
      if (exp === undefined || exp <= Math.floor(now / SECOND)) {
        logger.info("requireAuth(): User auth expired, attempting refresh");
        const result = await refreshToken(
          homeAccountId,
          sessionId,
          sessionExpiresAt,
        );

        if (result.error) {
          destroySessionAuth(session);
          destroySessionOffice(session);
          res.redirect("/auth/signin");
          return;
        }

        updateSessionAuth(session, result.value);
      }

      const allowedOffices = getOfficeClaimsFromSession(session);

      // If the user does not have offices available, then they will be unable to access the service.
      if (allowedOffices === undefined) {
        destroySessionOffice(session);
        logger.info("requireAuth(): User has no assigned office");
        res
          .status(HTTP_STATUS.FORBIDDEN)
          .render("main/error-no-assigned-office");
        return;
      }

      // Only check selected office if not on the office selection page.
      const officePathRegex = /^\/select-office(\/.*)?$/;
      const isOfficeSelectionPath = officePathRegex.exec(req.path) !== null;

      if (
        session.selectedOffice !== undefined &&
        !allowedOffices.includes(session.selectedOffice.code)
      ) {
        logger.warn("requireAuth(): Office is not in claims");
        destroySessionOffice(session);
        if (!isOfficeSelectionPath) {
          res.redirect("/select-office");
          return;
        }
      }

      // Does the user have a selected office? If not, redirect to the office selection page.
      if (!isOfficeSelectionPath && session.selectedOffice === undefined) {
        logger.info("requireAuth(): No selected office");
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
      if (
        error instanceof AuthError &&
        error.errorCode === EntraErrorCode.CUSTOM_AUTH_ERROR.valueOf()
      ) {
        destroySessionAuth(req.session);
        destroySessionOffice(req.session);
        logger.info(
          `Received Entra error "${error.errorCode}" when authenticating user: ${error.message}`,
        );
        res.status(FORBIDDEN).render("main/error-no-assigned-role");
        return;
      }

      logger.error("requireAuth(): Error checking user auth", error);
      next(error);
    }
  };
}
