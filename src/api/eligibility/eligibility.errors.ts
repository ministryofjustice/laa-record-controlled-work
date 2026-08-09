/* eslint-disable jsdoc/require-jsdoc -- not needed */
import { DomainError } from "#/lib/errors/domainError.js";

export class SaveApplicationMeansError extends DomainError {
  public readonly name = "SaveApplicationMeansError";

  constructor(cause?: unknown) {
    super("Failed to save application means data", cause);
  }
}
