/* eslint-disable jsdoc/require-jsdoc -- not needed */
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { DomainError } from "#/lib/errors/domainError.js";

/**
 * Base class for all Authentication errors.
 */
export class AuthenticationError extends DomainError {
  public readonly name: string = "AuthenticationError";
  public readonly statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

export class BadAuthenticationRequestError extends AuthenticationError {
  public readonly name = "BadAuthenticationRequestError";
  public readonly statusCode = HTTP_STATUS.BAD_REQUEST;

  constructor(
    message = "Authentication request was not properly formed",
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

export class MsalError extends AuthenticationError {
  public readonly name = "MsalError";

  constructor(cause?: unknown) {
    const message = cause instanceof Error ? cause.message : "Unknown error";
    super(`Authentication service error: ${message}`, cause);
  }
}

export class NotAuthenticatedError extends AuthenticationError {
  public readonly name = "NotAuthenticatedError";

  constructor(cause?: unknown) {
    super("User not authenticated", cause);
  }
}

export class PkceGenerationError extends AuthenticationError {
  public readonly name = "PkceGenerationError";

  constructor(cause?: unknown) {
    super("Failed to generate PKCE challenge", cause);
  }
}

export class TokenAcquisitionError extends AuthenticationError {
  public readonly name = "TokenAcquisitionError";
  public readonly statusCode = HTTP_STATUS.UNAUTHORIZED;

  constructor(cause?: unknown) {
    super("Token acquisition failed", cause);
  }
}

export class TokenRefreshError extends AuthenticationError {
  public readonly name = "TokenRefreshError";

  constructor(cause?: unknown) {
    super("Token refresh failed", cause);
  }
}
