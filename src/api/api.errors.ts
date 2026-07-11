/* eslint-disable jsdoc/require-jsdoc -- not needed */
import { DomainError } from "#/lib/errors/domainError.js";

export class ApiResponseError extends DomainError {
  public readonly name = "ApiResponseError";

  constructor(cause?: unknown) {
    super("API did not return a successful response", cause);
  }
}

export class ApiValidationError extends DomainError {
  public readonly name = "ApiValidationError";

  constructor(cause?: unknown) {
    super("API response failed schema validation", cause);
  }
}
