/* eslint-disable jsdoc/require-jsdoc -- not needed */
import { DomainError } from "./domainError.js";

export class MissingAuthCodeRequestError extends DomainError {
  public readonly name = "MissingAuthCodeRequestError";

  constructor(cause?: unknown) {
    super("Missing auth code request in session", cause);
  }
}

export class MsalError extends DomainError {
  public readonly name = "MsalError";

  constructor(cause?: unknown) {
    super("Authentication service error", cause);
  }
}

export class PkceGenerationError extends DomainError {
  public readonly name = "PkceGenerationError";

  constructor(cause?: unknown) {
    super("Failed to generate PKCE challenge", cause);
  }
}

export class StateMismatchError extends DomainError {
  public readonly name = "StateMismatchError";

  constructor(cause?: unknown) {
    super("State mismatch: possible CSRF attack", cause);
  }
}

export class TokenAcquisitionError extends DomainError {
  public readonly name = "TokenAcquisitionError";

  constructor(cause?: unknown) {
    super("Token acquisition failed", cause);
  }
}
