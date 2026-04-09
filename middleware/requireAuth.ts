import type { NextFunction, Request, Response } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.isAuthenticated) {
    return next();
  }

  res.redirect('/auth/signin');
}
