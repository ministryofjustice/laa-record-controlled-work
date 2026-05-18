/**
 * Common types and interfaces for form validation and error handling.
 */

export interface ErrorSummary {
  href?: string;
  text: string;
}

export interface InputError {
  fieldName: string;
  text: string;
}
