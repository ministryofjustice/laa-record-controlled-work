/* eslint-disable jsdoc/require-jsdoc -- not needed */
import { DomainError } from "#/lib/errors/domainError.js";

/**
 * Base class for all Authentication errors.
 */
export class AuthenticationError extends DomainError {
  public readonly name: string = "AuthenticationError";
}

export class BadAuthenticationRequestError extends AuthenticationError {
  public readonly name = "BadAuthenticationRequestError";

  constructor(cause?: unknown) {
    super("Authentication request was not properly formed", cause);
  }
}

export class MsalError extends AuthenticationError {
  public readonly name = "MsalError";

  constructor(message: string, cause?: unknown) {
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
