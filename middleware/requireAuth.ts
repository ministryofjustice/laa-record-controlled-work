import type { NextFunction, Request, Response } from "express";

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
  const bypassPaths = ["/health", "/status"];
  const { originalUrl, session } = req;

  if (bypassPaths.includes(originalUrl) || originalUrl.startsWith("/auth/")) {
    next();
    return;
  }

  if (session.isAuthenticated) {
    next();
    return;
  }

  req.session.returnTo = originalUrl;
  res.redirect("/auth/signin");
}
