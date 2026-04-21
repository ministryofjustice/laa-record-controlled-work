/**
 * Helpers Index
 *
 * Central export point for all helper utilities.
 * This allows for cleaner imports throughout the application.
 *
 * Usage:
 * import { devLog, safeString, formatDate } from '#src/scripts/helpers';
 */

// HTTP status codes
export {
  HTTP_FOUND,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_FORBIDDEN,
  HTTP_NOT_FOUND,
  HTTP_REQUEST_TIMEOUT,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_BAD_GATEWAY,
  HTTP_SERVICE_UNAVAILABLE,
  HTTP_GATEWAY_TIMEOUT,
} from "../constants/httpStatus.js";

// Development logging utilities
export {
  devLog,
  devWarn,
  devError,
  devDebug,
  isDevelopment,
} from "./devLogger.js";

// Data transformation utilities
export {
  safeString,
  safeOptionalString,
  booleanToString,
  isRecord,
  safeStringFromRecord,
  hasProperty,
  capitaliseFirst,
  safeBodyString,
  extractFormFields,
  safeApiField,
  safeNestedField,
  extractCurrentFields,
  normaliseSelectedCheckbox,
  isYes,
} from "./dataTransformers.js";

// Date formatting utilities
export { formatDate, dateStringFromThreeFields } from "./dateFormatter.js";

// Session helpers
export {
  storeSessionData,
  getSessionData,
  clearSessionData,
  clearAllOriginalFormData,
  storeOriginalFormData,
} from "./sessionHelpers.js";

export {
  initializeI18nextSync,
  i18next,
  t,
  nunjucksT,
  type ExpressLocaleLoader,
} from "./i18nLoader.js";

// Error handling utilities
export {
  extractErrorMessage,
  isHttpError,
  isAuthError,
  isForbiddenError,
  isNotFoundError,
  isServerError,
  createProcessedError,
  extractAndLogError,
} from "./errorHandler.js";

// Functional error handling
export { failure, success, Failure, Success, type Either } from "./result.js";
