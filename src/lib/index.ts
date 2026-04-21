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
  HTTP_STATUS,
  FOUND,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  INTERNAL_SERVER_ERROR,
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
