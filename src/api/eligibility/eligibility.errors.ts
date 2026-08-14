/* eslint-disable jsdoc/require-jsdoc -- not needed */
import { DomainError } from "#/lib/errors/domainError.js";

export class LoadEligibilityAssessmentError extends DomainError {
  public readonly name = "LoadEligibilityAssessmentError";

  constructor(cause?: unknown) {
    super("Failed to load application eligibility assessment", cause);
  }
}

export class SaveEligibilityAssessmentError extends DomainError {
  public readonly name = "SaveEligibilityAssessmentError";

  constructor(cause?: unknown) {
    super("Failed to save eligibility assessment", cause);
  }
}
