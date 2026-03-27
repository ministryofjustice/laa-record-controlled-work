/**
 * Development Logging Utilities
 *
 * Provides development-only console logging to keep production logs clean.
 * These functions only output to console when NODE_ENV is 'development' or undefined.
 */

/**
 * Development-only logging helper
 * @param {string} message Log message to output in development mode
 */
export function devLog(message: string): void {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
    console.log(message);
  }
}

/**
 * Development-only warning helper
 * @param {string} message Warning message to output in development mode
 */
export function devWarn(message: string): void {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
    console.warn(message);
  }
}

/**
 * Development-only error helper
 * @param {string} message Error message to output in development mode
 */
export function devError(message: string): void {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
    console.error(message);
  }
}

/**
 * Development-only debug helper
 * @param {string} message Debug message to output in development mode
 */
export function devDebug(message: string): void {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
    console.debug(message);
  }
}

/**
 * Check if currently running in development mode
 * @returns {boolean} True if in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
}
