import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "#/app/enums/httpStatus.enum.js";

import type { ApplicationError } from "../errors/ApplicationError.js";

/**
 * Global error handler middleware for Express.
 *
 * @param error  The error that was thrown.
 * @param req  The Express request object.
 * @param res  The Express response object.
 * @param next  The next middleware function in the stack.
 */
export function handleErrors(
  error: ApplicationError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const statusCode: HTTP_STATUS =
    error.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;

  switch (true) {
    // If unauthorised, redirect to the sign-in page.
    case statusCode === HTTP_STATUS.UNAUTHORIZED:
      res.redirect("/auth/signin");
      return;
    // Handle both 403 and 404 as Not Found to avoid enumeration of resources.
    case statusCode >= HTTP_STATUS.NOT_FOUND:
      res.redirect("/error/404");
      return;
    // Handle other 4xx requests as generic errors.
    case statusCode >= HTTP_STATUS.BAD_REQUEST:
      res.redirect("/error/400");
      return;
    // Handle other 5xx requests as generic errors.
    case statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR:
    default:
      res.redirect("/error/500");
  }
}
