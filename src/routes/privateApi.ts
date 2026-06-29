import type { NextFunction, Request, Response } from "express";

import express from "express";

import { BAD_REQUEST, OK } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";

const router = express.Router();

router.use(logFailureStatusCodes);

router.get("/load", (_req: Request, res: Response): void => {
  res.sendStatus(OK);
});

router.use(logRouteErrors);

export function logFailureStatusCodes(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.on("finish", () => {
    if (res.statusCode >= BAD_REQUEST) {
      const privateApiError = res.locals.privateApiError;
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

export function logRouteErrors(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.locals.privateApiError = error;

  const logError =
    error instanceof Error ? error : new Error(String(error));

  logger.error("Private API route error", logError, {
    method: req.method,
    path: req.originalUrl,
    statusCode: res.statusCode,
    errorMessage: logError.message,
    errorStack: logError.stack,
  });

  next(error);
}

export default router;
