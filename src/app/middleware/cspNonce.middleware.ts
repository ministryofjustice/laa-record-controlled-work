import type { NextFunction, Request, RequestHandler, Response } from "express";

import crypto from "node:crypto";

const RANDOMBYTES = 16;

/**
 * Middleware to generate a unique CSP nonce for each request.
 * @returns {RequestHandler}  The cspNonce middleware function.
 */
export function cspNonce(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.cspNonce = crypto.randomBytes(RANDOMBYTES).toString("base64");
    next();
  };
}
