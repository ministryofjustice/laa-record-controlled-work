import type { NextFunction, Request, Response } from "express";

const BYPASS_PATHS = ["/health", "/status"];

/**
 * Middleware that enforces authentication on all routes except public bypass paths.
 * Stores the original URL in the session for post-login redirect, then redirects to sign-in.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 * @returns {void}
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { originalUrl, session } = req;

  if (BYPASS_PATHS.includes(originalUrl) || originalUrl.startsWith("/auth/")) {
    next();
    return;
  }
  if (session.isAuthenticated) {
    res.locals.isAuthenticated = session.isAuthenticated;
    res.locals.user = session.account;
    next();
    return;
  }
  req.session.returnTo = originalUrl;

  if (session.selectedOffice === undefined) {
    req.session.returnTo = "/select-office";
  }
  res.redirect("/auth/signin");
}
