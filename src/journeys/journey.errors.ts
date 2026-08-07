/* eslint-disable jsdoc/require-jsdoc -- not needed */
import { DomainError } from "#/lib/errors/domainError.js";

export class InvalidFirmCodeClaimError extends DomainError {
  public readonly name = "InvalidFirmCodeClaimError";

  constructor(cause?: unknown) {
    super("Missing or invalid FIRM_CODE claim", cause);
  }
}

export class InvalidOfficeError extends DomainError {
  public readonly name = "InvalidOfficeError";

  constructor(cause?: unknown) {
    super("Office data is invalid", cause);
  }
}

export class InvalidSelectedOfficeError extends DomainError {
  public readonly name = "InvalidSelectedOfficeError";

  constructor(cause?: unknown) {
    super("Missing or invalid Selected Office", cause);
  }
}

export class InvalidSessionError extends DomainError {
  public readonly name = "InvalidSessionError";

  constructor(cause?: unknown) {
    super("Missing or invalid session data", cause);
  }
}
export class MissingFirmNameError extends DomainError {
  public readonly name = "MissingFirmNameError";

  constructor(cause?: unknown) {
    super("Missing firm Name", cause);
  }
}

export class NoAvailableOfficesError extends DomainError {
  public readonly name = "NoAvailableOfficesError";

  constructor(cause?: unknown) {
    super("No Available Offices", cause);
  }
}
