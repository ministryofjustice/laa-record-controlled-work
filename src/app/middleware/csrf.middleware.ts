import type { NextFunction, Request, Response } from "express";

import { csrfSync } from "csrf-sync";
import { match } from "path-to-regexp";

import config from "#/config.js";

/**
 * Type guard to check if an object has a _csrf property
 * @param {unknown} body - The request body to check
 * @returns {boolean} True if body has _csrf property
 */
const hasCSRFToken = (body: unknown): body is { _csrf: unknown } =>
  body !== null &&
  body !== undefined &&
  typeof body === "object" &&
  "_csrf" in body;

const { csrfSynchronisedProtection } = csrfSync({
  /**
   * Extracts the CSRF token from the request body.
   *
   * @param {Request} req - The incoming request object.
   * @returns {string|undefined} The CSRF token if present, otherwise undefined.
   */
  getTokenFromRequest: (req: Request): string | undefined => {
    // Type guard to ensure req.body exists and has _csrf property
    if (hasCSRFToken(req.body)) {
      return typeof req.body._csrf === "string" ? req.body._csrf : undefined;
    }
    return undefined;
  },
  /**
   * Skips CSRF validation for the Entra auth code callback — Entra POSTs
   * directly to this endpoint without a token; PKCE state provides equivalent protection.
   *
   * @param {Request} req - The incoming request object.
   * @returns {boolean} True if CSRF validation should be skipped.
   */
  skipCsrfProtection: (req: Request) => {
    for (const path of config.csrf.ignoredPaths) {
      const matcher = match(path, { decode: false });

      if (matcher(req.path) !== false) {
        return true;
      }
    }

    return false;
  },
});

/**
 * Middleware to expose the CSRF token to views.
 *
 * Access the CSRF token in templates using `{{ csrfToken }}`.
 *
 * @param {Request} req - The incoming request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
function addCsrfToLocals(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.locals.csrfToken =
    typeof req.csrfToken === "function" ? req.csrfToken() : undefined;

  next();
}

export { addCsrfToLocals, csrfSynchronisedProtection as csrf };
