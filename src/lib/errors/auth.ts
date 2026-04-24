/* eslint-disable jsdoc/require-jsdoc -- not needed */
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#src/lib/constants/httpStatus.js";
import { DomainError } from "./domainError.js";

export type AuthError =
  | MissingAuthCodeRequest
  | StateMismatch
  | TokenAcquisitionError
  | PkceGenerationError
  | MsalError;

export class MissingAuthCodeRequest extends DomainError {
  readonly status = BAD_REQUEST;

  constructor(cause: unknown) {
    super("Missing auth code request in session", { cause });
    this.name = "MissingAuthCodeRequest";
  }
}

export class StateMismatch extends DomainError {
  readonly status = BAD_REQUEST;

  constructor(cause: unknown) {
    super("State mismatch: possible CSRF attack", { cause });
    this.name = "StateMismatch";
  }
}

export class TokenAcquisitionError extends DomainError {
  readonly status = UNAUTHORIZED;

  constructor(cause: unknown) {
    super("Token acquisition failed", { cause });
    this.name = "TokenAcquisitionError";
  }
}

export class PkceGenerationError extends DomainError {
  readonly status = INTERNAL_SERVER_ERROR;

  constructor(cause: unknown) {
    super("Failed to generate PKCE challenge", { cause });
    this.name = "PkceGenerationError";
  }
}

export class MsalError extends DomainError {
  readonly status = INTERNAL_SERVER_ERROR;

  constructor(cause: unknown) {
    super("Authentication service error", { cause });
    this.name = "MsalError";
  }
}
