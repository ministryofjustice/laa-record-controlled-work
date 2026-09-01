import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";

import { logger } from "#/logger.js";

import type { ApplicationError } from "../errors/ApplicationError.js";

/**
 * Global error logger middleware for Express.
 *
 * @returns {Function}  The error handler.
 */
export const logGlobalErrors = (): ErrorRequestHandler => {
  return (
    err: ApplicationError,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    next(err);

    logger.error("Error caught by global error handling", err, {
      request: {
        url: req.url,
      },
    });
  };
};
