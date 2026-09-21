import { DomainError } from "#/lib/errors/domainError.js";

/**
 * Indicates that the application could not be loaded for export.
 */
export class LoadApplicationForExportError extends DomainError {
  public readonly name = "LoadApplicationForExportError";

  /**
   * Creates an export loading error.
   * @param cause - The underlying failure, when available.
   */
  constructor(cause?: unknown) {
    super("Failed to load application for export", cause);
  }
}
