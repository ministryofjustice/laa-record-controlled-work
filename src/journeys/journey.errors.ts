/* eslint-disable jsdoc/require-jsdoc -- not needed */
import { DomainError } from "#/lib/errors/domainError.js";

export class InvalidFirmCodeClaimError extends DomainError {
  public readonly name = "MissingFirmCodeClaimError";

  constructor(cause?: unknown) {
    super("Missing or invalid FIRM_CODE claim", cause);
  }
}

export class MissingSessionError extends DomainError {
  public readonly name = "MissingSessionError";

  constructor(cause?: unknown) {
    super("Missing or invalid session data", cause);
  }
}
