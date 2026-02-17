/**
 * Data Transformation Helpers
 *
 * Utility functions for safely transforming and validating data from form inputs
 */

/**
 * Type guard to check if value is a record object
 * @param {unknown} value Value to check
 * @returns {boolean} True if value is a record object
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if an object has a specific property (type guard)
 * @param {unknown} obj - Object to check
 * @param {string} key - Key to check for
 * @returns {boolean} True if object has the property
 */
export function hasProperty(obj: unknown, key: string): obj is Record<string, unknown> {
  return isRecord(obj) && key in obj;
}

/**
 * Capitalises the first letter of each word in a string
 * @param {string} str - The string to capitalise
 * @returns {string} The capitalised string
 */
export function capitaliseFirst(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Constants for date formatting
const DATE_PADDING_WIDTH = 2;
const DATE_PADDING_CHAR = '0';

/**
 * Constructs a date string in the format 'YYYY-MM-DD' from separate day, month, and year fields.
 * Pads the day and month values to ensure two digits using predefined padding width and character.
 *
 * @param {string} day - The day part of the date as a string (e.g., '1', '09').
 * @param {string} month - The month part of the date as a string (e.g., '2', '11').
 * @param {string} year - The year part of the date as a string (e.g., '2024').
 * @returns {string} The formatted date string in 'YYYY-MM-DD' format.
 */
export function dateStringFromThreeFields(day: string, month: string, year: string): string {
  const paddedMonth = month.padStart(DATE_PADDING_WIDTH, DATE_PADDING_CHAR);
  const paddedDay = day.padStart(DATE_PADDING_WIDTH, DATE_PADDING_CHAR);
  return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Safely extract and trim a string value from request body
 * @param {unknown} body - Request body object
 * @param {string} key - Key to extract
 * @returns {unknown} Value from body or empty string if not found
 */
export function safeBodyString(body: unknown, key: string): unknown {
  return hasProperty(body, key) ? body[key] : '';
}

/**
 * Extract multiple form field values from request body
 * @param {unknown} body - Request body object
 * @param {string[]} keys - Array of keys to extract
 * @returns {Record<string, unknown>} Object with extracted field values
 */
export function extractFormFields(body: unknown, keys: string[]): Record<string, unknown> {
  return keys.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = safeBodyString(body, key);
    return acc;
  }, {});
}