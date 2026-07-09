import type { NextFunction, Request, Response } from "express";

import { EntraService } from "#/auth/entra.service.js";
import { logger } from "#/logger.js";

/**
 * Silently refresh the access token on authenticated requests.
 * MSAL handles cache expiry automatically via the ICachePlugin - if the cached
 * token is valid, acquireTokenSilent returns it immediately. If expired, MSAL
 * automatically refreshes using the cached refresh token.
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

  const { account } = session;
  const entra = EntraService.create(req.hostname, req.sessionID);
  const result = await entra.acquireTokenSilent(account);

  if (result.error) {
    logger.warn("Silent token acquisition failed, redirecting to sign-in");
    session.returnTo = req.originalUrl;
    res.redirect("/auth/signin");
    return;
  }

  // Update session with refreshed token data (account/idToken may have changed)
  Object.assign(session, {
    account: result.value.account,
    idToken: result.value.idToken,
  });
  next();
}
