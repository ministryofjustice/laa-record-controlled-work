/* eslint-disable jsdoc/require-jsdoc -- not needed */
import { DomainError } from "#/lib/errors/domainError.js";

export class InvalidFirmCodeClaimError extends DomainError {
  public readonly name = "InvalidFirmCodeClaimError";

  constructor(cause?: unknown) {
    super("Missing or invalid FIRM_CODE claim", cause);
  }
}

export class InvalidSessionError extends DomainError {
  public readonly name = "InvalidSessionError";

  constructor(cause?: unknown) {
    super("Missing or invalid session data", cause);
  }
}

export class SelectedOfficeNotFoundError extends DomainError {
  public readonly name = "SelectedOfficeNotFoundError";

  constructor(cause?: unknown) {
    super("Selected Office not found", cause);
  }
}
