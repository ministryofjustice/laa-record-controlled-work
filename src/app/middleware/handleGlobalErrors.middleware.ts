import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";

import { HTTP_STATUS } from "#/app/enums/httpStatus.enum.js";

import type { ApplicationError } from "../errors/ApplicationError.js";

/**
 * Global error handler middleware for Express.
 *
 * Explicitly does not call `next()` to prevent further execution after an error
 * has been handled.
 *
 * @returns {Function}  The error handler.
 */
export const handleGlobalErrors = (): ErrorRequestHandler => {
  return function handleGlobalErrors(
    err: ApplicationError,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const statusCode: HTTP_STATUS =
      err.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;

    switch (true) {
      // If unauthorised, redirect to the sign-in page.
      case statusCode === HTTP_STATUS.UNAUTHORIZED:
        res.redirect("/auth/signin");
        return;
      // Handle both 403 and 404 as Not Found to avoid enumeration of resources.
      case statusCode === HTTP_STATUS.FORBIDDEN:
      case statusCode === HTTP_STATUS.NOT_FOUND:
        res.status(HTTP_STATUS.NOT_FOUND).render("main/error-404"); // .redirect("/error/404");
        return;
      // Handle other 5xx requests as generic errors.
      case statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR:
      default:
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).redirect("/error/500");
    }
  };
};
