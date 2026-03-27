import type { ValidationError, Result, Meta, Location } from 'express-validator';

/**
 * Interface for validation error data structure
 */
export interface ValidationErrorData {
  summaryMessage: string;
  inlineMessage: string;
  fieldPath?: string; // Add field path from express-validator
}

/**
 * Custom error class that extends Error and carries ValidationErrorData
 * This satisfies linting rules while providing type safety
 */
export class TypedValidationError extends Error {
  public readonly errorData: ValidationErrorData;

  /**
   * Creates a new TypedValidationError with structured error data
   * @param {ValidationErrorData} errorData - The validation error data containing summary and inline messages
   */
  constructor(errorData: ValidationErrorData) {
    super(errorData.summaryMessage);
    this.name = 'TypedValidationError';
    this.errorData = errorData;
  }
}

/**
 * Type guard to check if value is a record object
 * @param {unknown} value Value to check
 * @returns {boolean} True if value is a record object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if an object has a specific property (type guard)
 * @param {unknown} obj - Object to check
 * @param {string} key - Key to check for
 * @returns {boolean} True if object has the property
 */
function hasProperty(obj: unknown, key: string): obj is Record<string, unknown> {
  return isRecord(obj) && key in obj;
}

// Constants for magic numbers
const EMPTY_OBJECT_LENGTH = 0;
const ZERO_VALUE = 0;

/**
 * Check if value should return empty string
 * @param {unknown} value Value to check
 * @returns {boolean} True if should return empty string
 */
function shouldReturnEmptyString(value: unknown): boolean {
  return value === null || value === undefined || value === '' || value === ZERO_VALUE || value === false;
}

/**
 * Safely get string value from unknown data
 * @param {unknown} value Value to convert
 * @returns {string} String value or empty string
 */
function safeString(value: unknown): string {
  // Handle null, undefined, empty string, zero, and false
  if (shouldReturnEmptyString(value)) {
    return '';
  }
  
  // Handle string type
  if (typeof value === 'string') {
    return value;
  }
  
  // Handle number and boolean types
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  // Handle objects - avoid unsafe toString operations
  if (typeof value === 'object' && value !== null) {
    // Handle empty objects specifically
    if (Object.keys(value).length === EMPTY_OBJECT_LENGTH) {
      return '';
    }
    
    // For objects, use JSON.stringify as it's safer than toString
    try {
      return JSON.stringify(value);
    } catch {
      return '[object Object]';
    }
  }
  
  // Fallback to String conversion
  return String(value);
}

/**
 * Custom error formatter for express-validator that preserves type safety
 * This is the express-validator recommended approach using formatWith()
 * @param {ValidationError} error - The express-validator error object
 * @returns {ValidationErrorData} Typed error data object
 */
export function formatValidationError(error: ValidationError): ValidationErrorData {
  // Handle TypedValidationError instances
  if (error.msg instanceof TypedValidationError) {
    return error.msg.errorData;
  }

  // Handle the case where the error message is already our ValidationErrorData
  if (isRecord(error.msg) &&
    hasProperty(error.msg, 'summaryMessage') &&
    hasProperty(error.msg, 'inlineMessage')) {
    return {
      summaryMessage: safeString(error.msg.summaryMessage),
      inlineMessage: safeString(error.msg.inlineMessage)
    };
  }

  // Fallback: treat the message as both summary and inline
  const safeMessage = safeString(error.msg);
  const message = safeMessage !== '' ? safeMessage : 'Invalid value';
  return {
    summaryMessage: message,
    inlineMessage: message
  };
}

/**
 * Creates a change detection validator that checks if any of the specified field pairs have changed
 * @param {Array<{ current: string; original: string }>} fieldMappings - Array of {current, original} field name pairs to compare
 * @param {object} errorMessage - Error message to show when no changes detected
 * @param {string} errorMessage.summaryMessage - Summary error message
 * @param {string} errorMessage.inlineMessage - Inline error message
 * @returns {object} Express-validator custom validator configuration
 */
export function createChangeDetectionValidator(
  fieldMappings: Array<{ current: string; original: string }>,
  errorMessage: { summaryMessage: string | (() => string); inlineMessage: string | (() => string) }
): {
  in: Location[];
  custom: {
    options: (_value: string, meta: Meta) => boolean;
    errorMessage: () => TypedValidationError;
  };
} {
  return {
    in: ['body'] as Location[],
    custom: {
      /**
       * Schema to check if any of the specified field values have been unchanged.
       * @param {string} _value - Placeholder value (unused)
       * @param {Meta} meta - `express-validator` context containing request object
       * @returns {boolean} True if any field has changed
       */
      options: (_value: string, meta: Meta): boolean => {
        const { req } = meta;
        
        if (!isRecord(req.body)) {
          return true;
        }

        // Check if any field has changed using type-safe property access
        const hasChanges = fieldMappings.some(({ current, original }) => {
          const currentRaw = hasProperty(req.body, current) ? req.body[current] : '';
          const originalRaw = hasProperty(req.body, original) ? req.body[original] : '';
          
          // Normalize boolean/checkbox values for comparison
          /**
           * Normalize boolean/checkbox values for consistent comparison between form data and stored values
           * @param {string} value - The input value to normalize
           * @returns {string} Normalized value as "true" or "false" string
           */
          const normalizeBooleanValue = (value: string): string => {
            const stringValue = safeString(value).trim().toLowerCase();
            // Treat empty string, "false", and "off" as falsy (unchecked)
            if (stringValue === '' || stringValue === 'false' || stringValue === 'off') {
              return 'false';
            }
            // Treat "on", "true", "1" as truthy (checked)
            if (stringValue === 'on' || stringValue === 'true' || stringValue === '1') {
              return 'true';
            }
            // For non-boolean fields, return the trimmed value as-is
            return stringValue;
          };
          
          const currentValue = normalizeBooleanValue(safeString(currentRaw));
          const originalValue = normalizeBooleanValue(safeString(originalRaw));
          const hasChanged = currentValue !== originalValue;
          
          return hasChanged;
        });
        
        return hasChanges;
      },
      /**
       * Custom error message for when no changes are made
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => {
        /**
         * Resolve possibly lazy string value.
         * @param {string | (() => string)} val - Value or thunk
         * @returns {string} Resolved string
         */
        const resolve = (val: string | (() => string)): string => typeof val === 'function' ? val() : val;
        const summaryMessage = resolve(errorMessage.summaryMessage);
        const inlineMessage = resolve(errorMessage.inlineMessage);

        return new TypedValidationError({ summaryMessage, inlineMessage });
      }
    }
  };
}

/**
 * Enhanced validation error handler that formats errors for GOV.UK components
 * @param {Result} validationResult - Result from express-validator
 * @returns {object} Formatted errors for GOV.UK error summary and field display
 */
export function formatValidationErrors(validationResult: Result): {
  inputErrors: Record<string, string>;
  errorSummaryList: Array<{ text: string; href: string }>;
} {
  const rawErrors = validationResult.array();
  
  // Format errors using the error formatter
  const formattedErrors = rawErrors.map((error: ValidationError) => {
    const fieldName = ('path' in error && typeof error.path === 'string') ? error.path : 'unknown';
    const errorData = formatValidationError(error);
    
    return {
      fieldName,
      ...errorData
    };
  });
  
  // Build input errors object for inline field errors
  const inputErrors = formattedErrors.reduce<Record<string, string>>((errors, errorItem) => {
    const { fieldName, inlineMessage } = errorItem;
    if (inlineMessage.trim() !== '') {
      errors[fieldName] = inlineMessage;
    }
    return errors;
  }, {});
  
  // Build error summary list for GOV.UK error summary component
  const errorSummaryList = formattedErrors.map(({ summaryMessage, fieldName }) => ({
    text: summaryMessage,
    href: `#${fieldName}`
  }));
  
  return {
    inputErrors,
    errorSummaryList
  };
}