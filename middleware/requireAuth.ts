import type { NextFunction, Request, Response } from "express";

/**
 *
 * @param req
 * @param res
 * @param next
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const bypassPaths = ["/health", "/status"];

  if (
    bypassPaths.includes(req.originalUrl) ||
    req.originalUrl.startsWith("/auth/")
  ) {
    next();
    return;
  }

  if (req.session?.isAuthenticated) {
    next();
    return;
  }
  req.session.returnTo = req.originalUrl;
  res.redirect("/auth/signin");
}
