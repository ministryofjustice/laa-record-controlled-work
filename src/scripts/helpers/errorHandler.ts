/**
 * Error Handler Utility
 * 
 * Provides comprehensive error handling for API requests including:
 * - HTTP status code mapping to user-friendly messages
 * - Network error handling
 * - Response message extraction
 * - Structured logging
 */

import { devError } from './index.js';

// HTTP Status Code Constants
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_REQUEST_TIMEOUT = 408;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SERVICE_UNAVAILABLE = 503;
const HTTP_GATEWAY_TIMEOUT = 504;

/**
 * Type guard for Axios error with response
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is an Axios error with response
 */
function isAxiosError(error: unknown): error is { response: { status: number; data?: unknown; statusText?: string } } {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'response' in error &&
    error.response !== null &&
    typeof error.response === 'object' &&
    'status' in error.response &&
    typeof (error.response as { status: unknown }).status === 'number'
  );
}

/**
 * Type guard for network error
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is a network error
 */
function isNetworkError(error: unknown): error is { code: string; message?: string } {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Get user-friendly message for HTTP status codes
 * @param {number} status - HTTP status code
 * @returns {string} User-friendly error message
 */
function getHttpErrorMessage(status: number): string {
  switch (status) {
    case HTTP_BAD_REQUEST:
      return 'Invalid request. Please check your input and try again.';
    case HTTP_UNAUTHORIZED:
      return 'Authentication failed. Please log in again.';
    case HTTP_FORBIDDEN:
      return 'You do not have permission to access this resource.';
    case HTTP_NOT_FOUND:
      return 'The requested information could not be found.';
    case HTTP_REQUEST_TIMEOUT:
      return 'Request timed out. Please try again.';
    case HTTP_TOO_MANY_REQUESTS:
      return 'Too many requests. Please wait a moment and try again.';
    case HTTP_INTERNAL_SERVER_ERROR:
      return 'Internal server error. Please try again later.';
    case HTTP_BAD_GATEWAY:
      return 'Service temporarily unavailable. Please try again later.';
    case HTTP_SERVICE_UNAVAILABLE:
      return 'Service unavailable. Please try again later.';
    case HTTP_GATEWAY_TIMEOUT:
      return 'Request timed out. Please try again later.';
    default:
      return `Service error (${status}). Please try again later.`;
  }
}

/**
 * Get user-friendly message for network errors
 * @param {string} code - Network error code
 * @returns {string} User-friendly error message
 */
function getNetworkErrorMessage(code: string): string {
  switch (code) {
    case 'ECONNREFUSED':
      return 'Unable to connect to the service. Please try again later.';
    case 'ENOTFOUND':
      return 'Service not found. Please check your connection and try again.';
    case 'ETIMEDOUT':
      return 'Request timed out. Please try again.';
    case 'ECONNRESET':
      return 'Connection was reset. Please try again.';
    default:
      return 'Network error. Please check your connection and try again.';
  }
}

/**
 * Extract error message from response data
 * @param {unknown} data - Response data
 * @returns {string | null} Extracted message or null
 */
function extractResponseMessage(data: unknown): string | null {
  if (data !== null && data !== undefined && typeof data === 'object' && 'message' in data) {
    const responseData = data as { message: unknown };
    return typeof responseData.message === 'string' ? responseData.message : null;
  }
  return null;
}

/**
 * Extract error message from various error types with user-friendly messages
 * @param {unknown} error - Error object
 * @returns {string} User-friendly error message
 */
export function extractErrorMessage(error: unknown): string {
  // Handle Axios errors with response
  if (isAxiosError(error)) {
    const { response } = error;
    devError(`API HTTP Error ${response.status}: ${response.statusText ?? 'Unknown'}`);

    // Try to extract error message from response data
    const responseMessage = extractResponseMessage(response.data);
    if (responseMessage !== null) {
      return responseMessage;
    }

    return getHttpErrorMessage(response.status);
  }

  // Handle network errors
  if (isNetworkError(error)) {
    devError(`Network Error: ${error.code}`);
    return getNetworkErrorMessage(error.code);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    devError(`Error: ${error.message}`);
    return 'An unexpected error occurred. Please try again.';
  }

  // Handle string errors
  if (typeof error === 'string') {
    devError(`String Error: ${error}`);
    return 'An error occurred. Please try again.';
  }

  // Fallback for unknown error types
  devError(`Unknown Error: ${String(error)}`);
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if an error is a specific HTTP status code
 * @param {unknown} error - Error to check
 * @param {number} status - HTTP status code to check for
 * @returns {boolean} True if error is an HTTP error with the specified status
 */
export function isHttpError(error: unknown, status: number): boolean {
  return isAxiosError(error) && error.response.status === status;
}

/**
 * Check if an error is an authentication error (401)
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is a 401 authentication error
 */
export function isAuthError(error: unknown): boolean {
  return isHttpError(error, HTTP_UNAUTHORIZED);
}

/**
 * Check if an error is a forbidden error (403)
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is a 403 forbidden error
 */
export function isForbiddenError(error: unknown): boolean {
  return isHttpError(error, HTTP_FORBIDDEN);
}

/**
 * Check if an error is a not found error (404)
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is a 404 not found error
 */
export function isNotFoundError(error: unknown): boolean {
  return isHttpError(error, HTTP_NOT_FOUND);
}

/**
 * Check if an error is a server error (5xx)
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is a server error
 */
export function isServerError(error: unknown): boolean {
  return isAxiosError(error) && error.response.status >= HTTP_INTERNAL_SERVER_ERROR;
}

/**
 * Create a processed error with user-friendly message for global error handler
 * @param {unknown} originalError - Original error object
 * @param {string} context - Context description for logging (e.g., "loading cases", "fetching client details")
 * @returns {Error} Processed error with user-friendly message
 */
export function createProcessedError(originalError: unknown, context: string): Error {
  // Extract user-friendly message
  const userFriendlyMessage = extractErrorMessage(originalError);
  
  // Log the error with context
  devError(`Error ${context}: ${userFriendlyMessage}`);
  
  // Create processed error with user-friendly message
  const processedError = new Error(userFriendlyMessage);
  processedError.cause = originalError; // Preserve original error for debugging
  
  return processedError;
}

/**
 * Extract error message and log it with context (for API services)
 * @param {unknown} error - Original error object
 * @param {string} context - Context description for logging (e.g., "API error", "Database error")
 * @returns {string} User-friendly error message
 */
export function extractAndLogError(error: unknown, context: string): string {
  const userFriendlyMessage = extractErrorMessage(error);
  devError(`${context}: ${userFriendlyMessage}`);
  return userFriendlyMessage;
}
