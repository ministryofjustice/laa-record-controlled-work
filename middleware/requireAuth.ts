import type { NextFunction, Request, Response } from "express";

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
    return next();
  }

  if (req.session?.isAuthenticated) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect("/auth/signin");
}
