import type { NextFunction, Request, Response } from "express";

import { EntraService } from "#/auth/entra.service.js";
import { MINUTE } from "#/lib/constants/time.js";
import { logger } from "#/logger.js";

/* eslint-disable @typescript-eslint/no-magic-numbers -- 5 minutes is self-documenting */
const REFRESH_GRACE_PERIOD_MS = 5 * MINUTE;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * Silently refresh the access token when it is missing or within the grace period of
 * expiry. Redirects to sign in if refresh fails.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next middleware function.
 */
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { session } = req;

  if (!session.isAuthenticated || !session.account) {
    next();
    return;
  }

  const { account, tokenCache, tokenExpiry } = session;
  const shouldRefresh =
    tokenExpiry === undefined ||
    tokenExpiry - Date.now() < REFRESH_GRACE_PERIOD_MS;

  if (!shouldRefresh) {
    next();
    return;
  }

  if (!tokenCache) {
    logger.warn(
      "No token cache available for silent refresh, redirecting to sign-in",
    );
    session.returnTo = req.originalUrl;
    res.redirect("/auth/signin");
    return;
  }

  const entra = EntraService.create(req.hostname);
  const result = await entra.getAccessToken(tokenCache, account);

  if (result.error) {
    logger.warn("Silent token refresh failed, redirecting to sign-in");
    session.returnTo = req.originalUrl;
    res.redirect("/auth/signin");
    return;
  }

  Object.assign(session, result.value);
  next();
}
