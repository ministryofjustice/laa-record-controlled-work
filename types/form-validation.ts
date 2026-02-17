/**
 * Common types and interfaces for form validation and error handling.
 */

export interface InputError {
  fieldName: string;
  text: string;
}

export interface ErrorSummary {
  text: string;
  href?: string;
}