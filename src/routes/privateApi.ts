import type { NextFunction, Request, Response } from "express";

import express from "express";

import { BAD_REQUEST, OK } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

const router = express.Router();

interface PrivateApiLocals {
  privateApiError?: unknown;
}

router.use(logFailureStatusCodes);

router.get("/load", (_req: Request, res: Response): void => {
  res.json({ return_url: "http://localhost:8080" });
});

router.get("/save", (_, res: Response) => {
  res.status(OK);
});

router.use(logRouteErrors);

/**
 * Logs non-2xx/3xx private API responses, including captured error details where available.
 * @param req Express request object.
 * @param res Express response object with typed private API locals.
 * @param next Express next callback.
 */
export function logFailureStatusCodes(
  req: Request,
  res: Response<unknown, PrivateApiLocals>,
  next: NextFunction,
): void {
  res.on("finish", () => {
    if (res.statusCode >= BAD_REQUEST) {
      const { privateApiError } = res.locals;
      const errorDetails =
        privateApiError instanceof Error
          ? {
              errorMessage: privateApiError.message,
              errorStack: privateApiError.stack,
            }
          : {};

      logger.warn("Private API request returned failure status", {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ...errorDetails,
      });
    }
  });

  next();
}

/**
 * Captures and logs route errors with message and stack trace before delegating to downstream handlers.
 * @param error The error propagated by upstream middleware/handlers.
 * @param req Express request object.
 * @param res Express response object with typed private API locals.
 * @param next Express next callback.
 */
export function logRouteErrors(
  error: unknown,
  req: Request,
  res: Response<unknown, PrivateApiLocals>,
  next: NextFunction,
): void {
  res.locals.privateApiError = error;

  const logError = error instanceof Error ? error : new Error(String(error));

  logger.error("Private API route error", logError, {
    errorMessage: logError.message,
    errorStack: logError.stack,
    method: req.method,
    path: req.originalUrl,
    statusCode: res.statusCode,
  });

  next(error);
}

export default router;
