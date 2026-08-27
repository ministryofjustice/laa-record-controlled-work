/* eslint-disable jsdoc/require-jsdoc -- not needed */
import type { Request, Response } from "express";

import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  SERVICE_UNAVAILABLE,
  UNAUTHORIZED,
} from "#/app/enums/httpStatus.enum.js";
import { DomainError } from "#/lib/errors/domainError.js";

const ErrorStatuses: Record<string, number> = {
  DatabaseTimeoutError: SERVICE_UNAVAILABLE,
  OAuthFailureError: UNAUTHORIZED,
  UserNotFoundError: NOT_FOUND,
  ValidationFailureError: BAD_REQUEST,
};

// TODO: this is an example, it's not hooked up to the service yet.
// needs to be properly scoped and tested before use.

export function globalErrorHandler(
  err: Error,
  _: Request,
  res: Response,
): void {
  if (process.env.NODE_ENV === "production") {
    // this needs refining for specific error pages like unauthorised
    res.redirect("/something-went-wrong");
    return;
  }

  // need to consider handling for web requests and API requests separately
  // for errors on CCQ data persistence endpoints

  const statusCode = ErrorStatuses[err.name] || INTERNAL_SERVER_ERROR;
  if (err instanceof DomainError) {
    res.status(statusCode).json(err);
    return;
  }

  res.status(statusCode).json({
    message: "Something went wrong.",
    name: err.name,
  });
}
