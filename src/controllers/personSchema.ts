import { checkSchema, type Meta } from "express-validator";
import validator from "validator";

import { isRecord, safeBodyString } from "#/lib/dataTransformers.js";
import { dateStringFromThreeFields } from "#/lib/dateFormatter.js";
import { t } from "#/lib/i18nLoader.js";

import { TypedValidationError } from "../lib/ValidationErrorHelpers.js";

// Constants for validation boundaries
const MIN_DAY = 1;
const MAX_DAY = 31;
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const YEAR_LENGTH = 4;
const MIN_COMMUNICATION_METHODS = 1;
const EMPTY = 0;

/**
 * Helper function to create date validation error messages
 * @param {string} field - Field name (day, month, year)
 * @param {string} errorType - Type of error (notEmpty, isLength, etc)
 * @returns {TypedValidationError} Structured error object
 */
function createDateValidationError(
  field: string,
  errorType: string,
): TypedValidationError {
  const messageKey = `forms.dateOfBirth.validationError.${field}.${errorType}`;
  return new TypedValidationError({
    inlineMessage: t(messageKey),
    summaryMessage: t(messageKey),
  });
}

/**
 * Helper function to get safe date field values from request body
 * @param {unknown} body - Request body object
 * @returns {object} Object with day, month, year values
 */
function getDateFields(body: unknown): {
  day: string;
  month: string;
  year: string;
} {
  if (!isRecord(body)) {
    return { day: "", month: "", year: "" };
  }

  const dayValue = safeBodyString(body, "dateOfBirth-day");
  const monthValue = safeBodyString(body, "dateOfBirth-month");
  const yearValue = safeBodyString(body, "dateOfBirth-year");

  return {
    day: typeof dayValue === "string" ? dayValue : "",
    month: typeof monthValue === "string" ? monthValue : "",
    year: typeof yearValue === "string" ? yearValue : "",
  };
}

/**
 * Helper function to check if any date field has a value
 * @param {string} day - Day field value
 * @param {string} month - Month field value
 * @param {string} year - Year field value
 * @returns {boolean} True if any field has content
 */
function hasAnyDateField(day: string, month: string, year: string): boolean {
  return (
    (typeof day === "string" && day.trim().length > EMPTY) ||
    (typeof month === "string" && month.trim().length > EMPTY) ||
    (typeof year === "string" && year.trim().length > EMPTY)
  );
}

/**
 * Checks if any date fields have been partially filled (MCC pattern)
 * @param {unknown} body - Request body
 * @returns {boolean} True if any date field has content
 */
function hasPartialDateFields(body: unknown): boolean {
  if (!isRecord(body)) return false;
  const { day, month, year } = getDateFields(body);
  return hasAnyDateField(day, month, year);
}

/**
 * Type guard to safely check if a value is a valid record
 * @param {unknown} value - The value to check
 * @returns {boolean} True if value is a non-null object
 */
function isValidRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validates day field following MCC pattern
 * @param {string} value - The day value
 * @param {unknown} body - Request body
 * @returns {boolean} True if validation passes
 */
function validateDayField(value: string, body: unknown): boolean {
  const currentValue = typeof value === "string" ? value.trim() : "";

  if (!hasPartialDateFields(body)) return true; // All empty is fine
  if (currentValue.length === EMPTY) return false; // Required if any field provided

  const dayNum = parseInt(currentValue, 10);
  return !isNaN(dayNum) && dayNum >= MIN_DAY && dayNum <= MAX_DAY;
}

/**
 * Validates month field following MCC pattern
 * @param {string} value - The month value
 * @param {unknown} body - Request body
 * @returns {boolean} True if validation passes
 */
function validateMonthField(value: string, body: unknown): boolean {
  const currentValue = typeof value === "string" ? value.trim() : "";

  if (!hasPartialDateFields(body)) return true; // All empty is fine
  if (currentValue.length === EMPTY) return false; // Required if any field provided

  const monthNum = parseInt(currentValue, 10);
  return !isNaN(monthNum) && monthNum >= MIN_MONTH && monthNum <= MAX_MONTH;
}

/**
 * Validates year field following MCC pattern
 * @param {string} value - The year value
 * @param {unknown} body - Request body
 * @returns {boolean} True if validation passes
 */
function validateYearField(value: string, body: unknown): boolean {
  const currentValue = typeof value === "string" ? value.trim() : "";

  if (!hasPartialDateFields(body)) return true; // All empty is fine
  if (currentValue.length === EMPTY) return false; // Required if any field provided
  if (currentValue.length !== YEAR_LENGTH) return false;

  const yearNum = parseInt(currentValue, 10);
  return !isNaN(yearNum);
}

/**
 * Validation middleware for person input (name and address).
 * Ensures both fields are strings and meet basic requirements.
 * @returns {Error} Validation schema for express-validator
 */
export const validatePerson = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    address: {
      customSanitizer: {
        /**
         * Custom sanitizer for address field - preserves null/undefined for validation
         * @param {unknown} value - The input value to sanitize
         * @returns {unknown} Sanitized value
         */
        options: (value: unknown) => {
          // Preserve undefined and null to allow proper validation
          if (value === undefined || value === null) {
            return value;
          }
          // Convert any non-string value to string for consistent processing
          if (typeof value !== "string") {
            if (typeof value === "object") return "";
            if (typeof value === "number" || typeof value === "boolean") {
              return String(value);
            }
            return "";
          }
          return value;
        },
      },
      in: ["body"],
      notEmpty: {
        /**
         * Custom error message for empty address field using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t("forms.address.validationError.notEmpty"),
            summaryMessage: t("forms.address.validationError.notEmpty"),
          }),
      },
      trim: true,
    },
    communicationMethods: {
      in: ["body"],
      isArray: {
        /**
         * Custom error message for empty communication methods array using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t(
              "forms.communicationMethods.validationError.notEmpty",
            ),
            summaryMessage: t(
              "forms.communicationMethods.validationError.notEmpty",
            ),
          }),
        options: { min: MIN_COMMUNICATION_METHODS },
      },
    },
    contactPreference: {
      custom: {
        /**
         * Custom error message for unchanged contact preference using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t(
              "forms.contactPreference.validationError.notChanged",
            ),
            summaryMessage: t(
              "forms.contactPreference.validationError.notChanged",
            ),
          }),
        /**
         * Validates that the contact preference has been changed from the original value
         * Following MCC pattern for change validation
         * @param {string} value - The contact preference value from the form
         * @param {Meta} meta - express-validator metadata containing request object
         * @returns {boolean} True if the value has changed from original or no original exists
         */
        options: (value: string, { req }: Meta): boolean => {
          // Get original form data from session
          const { session } = req;
          const originalData =
            session !== null && session !== undefined && isValidRecord(session)
              ? session.personOriginal
              : undefined;
          if (!isValidRecord(originalData)) {
            return true; // No original data to compare against
          }

          const { contactPreference: originalContactPreference } = originalData;
          if (
            originalContactPreference === undefined ||
            originalContactPreference === null
          ) {
            return true; // No original contact preference to compare against
          }

          // Return true if the value has changed, false if it's the same
          return value !== originalContactPreference;
        },
      },
      in: ["body"],
      isIn: {
        /**
         * Custom error message for invalid contact preference using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t(
              "forms.contactPreference.validationError.invalidOption",
            ),
            summaryMessage: t(
              "forms.contactPreference.validationError.invalidOption",
            ),
          }),
        options: [["email", "phone", "post"]],
      },
      notEmpty: {
        /**
         * Custom error message for empty contact preference field using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t(
              "forms.contactPreference.validationError.notEmpty",
            ),
            summaryMessage: t(
              "forms.contactPreference.validationError.notEmpty",
            ),
          }),
      },
    },
    "dateOfBirth-day": {
      custom: {
        /**
         * Custom error message for dateOfBirth day field validation
         * @param {string} value - The day value from the form
         * @param {object} root0 - Meta object from express-validator
         * @param {object} root0.req - Express request object
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: (value: string, { req }: Meta) => {
          if (!isRecord(req.body)) {
            return createDateValidationError("day", "notEmpty");
          }

          const { day, month, year } = getDateFields(req.body);

          const hasDateFields = hasAnyDateField(day, month, year);

          if (
            hasDateFields &&
            (typeof value !== "string" || value.trim().length === EMPTY)
          ) {
            return createDateValidationError("day", "notEmpty");
          }

          return createDateValidationError("day", "isInt");
        },
        /**
         * Validate day field in date of birth - requires all or none
         * @param {string} value - The day value to validate
         * @param {object} root0 - Metadata object
         * @param {object} root0.req - Express request object
         * @returns {boolean} True if validation passes, false otherwise
         */
        options: (value: string, { req }: Meta): boolean =>
          validateDayField(value, req.body),
      },
      in: ["body"],
      trim: true,
    },
    "dateOfBirth-month": {
      custom: {
        /**
         * Generates error message for dateOfBirth month field validation
         * @param {string} value - The month value from the form
         * @param {object} root0 - Meta object from express-validator
         * @param {object} root0.req - Express request object
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: (value: string, { req }: Meta) => {
          if (!isRecord(req.body)) {
            return createDateValidationError("month", "notEmpty");
          }

          const { day, month, year } = getDateFields(req.body);

          const hasDateFields = hasAnyDateField(day, month, year);

          if (
            hasDateFields &&
            (typeof value !== "string" || value.trim().length === EMPTY)
          ) {
            return createDateValidationError("month", "notEmpty");
          }

          return createDateValidationError("month", "isInt");
        },
        /**
         * Validates dateOfBirth month field - requires all date fields if any are provided
         * @param {string} value - The month value from the form
         * @param {object} root0 - Meta object from express-validator
         * @param {object} root0.req - Express request object
         * @returns {boolean} True if validation passes, false otherwise
         */
        options: (value: string, { req }: Meta): boolean =>
          validateMonthField(value, req.body),
      },
      in: ["body"],
      trim: true,
    },
    "dateOfBirth-year": {
      custom: {
        /**
         * Generates error message for dateOfBirth year field validation
         * @param {string} value - The year value from the form
         * @param {object} root0 - Meta object from express-validator
         * @param {object} root0.req - Express request object
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: (value: string, { req }: Meta) => {
          if (!isRecord(req.body)) {
            return new TypedValidationError({
              inlineMessage: t(
                "forms.dateOfBirth.validationError.year.notEmpty",
              ),
              summaryMessage: t(
                "forms.dateOfBirth.validationError.year.notEmpty",
              ),
            });
          }

          const { day, month, year } = getDateFields(req.body);

          const hasDateFields = hasAnyDateField(day, month, year);

          if (
            hasDateFields &&
            (typeof value !== "string" || value.trim().length === EMPTY)
          ) {
            return createDateValidationError("year", "notEmpty");
          }

          const yearStr = value.trim();
          if (yearStr.length > EMPTY && yearStr.length !== YEAR_LENGTH) {
            return createDateValidationError("year", "isLength");
          }

          return createDateValidationError("year", "isInt");
        },
        /**
         * Validates dateOfBirth year field - requires all date fields if any are provided
         * @param {string} value - The year value from the form
         * @param {object} root0 - Meta object from express-validator
         * @param {object} root0.req - Express request object
         * @returns {boolean} True if validation passes, false otherwise
         */
        options: (value: string, { req }: Meta): boolean =>
          validateYearField(value, req.body),
      },
      in: ["body"],
      trim: true,
    },
    fullName: {
      customSanitizer: {
        /**
         * Custom sanitizer for fullName field - preserves null/undefined for validation
         * @param {unknown} value - The input value to sanitize
         * @returns {unknown} Sanitized value
         */
        options: (value: unknown) => {
          // Preserve undefined and null to allow proper validation
          if (value === undefined || value === null) {
            return value;
          }
          // Convert any non-string value to string for consistent processing
          if (typeof value !== "string") {
            if (typeof value === "object") return "";
            if (typeof value === "number" || typeof value === "boolean") {
              return String(value);
            }
            return "";
          }
          return value;
        },
      },
      in: ["body"],
      notEmpty: {
        /**
         * Custom error message for empty name field using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t("forms.name.validationError.notEmpty"),
            summaryMessage: t("forms.name.validationError.notEmpty"),
          }),
      },
      trim: true,
    },
    priority: {
      custom: {
        /**
         * Custom error message for unchanged priority using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t("forms.priority.validationError.notChanged"),
            summaryMessage: t("forms.priority.validationError.notChanged"),
          }),
        /**
         * Validates that the priority has been changed from the original value
         * Following MCC pattern for change validation
         * @param {string} value - The priority value from the form
         * @param {Meta} meta - express-validator metadata containing request object
         * @returns {boolean} True if the value has changed from original or no original exists
         */
        options: (value: string, { req }: Meta): boolean => {
          // Get original form data from session following MCC pattern
          const { session } = req;
          if (!isRecord(session) || !isValidRecord(session.personOriginal)) {
            return true; // No original data to compare against
          }

          const { personOriginal: originalData } = session;

          const { priority: originalPriority } = originalData;
          if (originalPriority === undefined || originalPriority === null) {
            return true; // No original priority to compare against
          }

          // Return true if the value has changed, false if it's the same
          return value !== originalPriority;
        },
      },
      in: ["body"],
      isIn: {
        /**
         * Custom error message for invalid priority using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t("forms.priority.validationError.invalidOption"),
            summaryMessage: t("forms.priority.validationError.invalidOption"),
          }),
        options: [["low", "medium", "high", "urgent"]],
      },
      notEmpty: {
        /**
         * Custom error message for empty priority field using i18n
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t("forms.priority.validationError.notEmpty"),
            summaryMessage: t("forms.priority.validationError.notEmpty"),
          }),
      },
    },
    validDate: {
      custom: {
        bail: true, // Stop validation if date format is invalid
        /**
         * Custom error message for invalid date combinations
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () =>
          new TypedValidationError({
            inlineMessage: t("forms.dateOfBirth.validationError.validDate"),
            summaryMessage: t("forms.dateOfBirth.validationError.validDate"),
          }),
        /**
         * Schema to check if the day/month/year combination forms a valid date.
         * Only validates if at least one date field is provided.
         * @param {string} _value - Placeholder value (unused)
         * @param {Meta} meta - `express-validator` context containing request object
         * @returns {boolean} True if the date combination is valid or if no date fields are provided
         */
        options: (_value: string, meta: Meta): boolean => {
          const { req } = meta;

          if (!isRecord(req.body)) {
            return true;
          }

          // Get trimmed values from the helper function (same logic as individual field validations)
          const { day, month, year } = getDateFields(req.body);

          // Trim the values to handle whitespace consistently with field validations
          const dayTrimmed = day.trim();
          const monthTrimmed = month.trim();
          const yearTrimmed = year.trim();

          // If no date fields are provided, skip validation - following MCC pattern
          if (
            dayTrimmed.length === EMPTY &&
            monthTrimmed.length === EMPTY &&
            yearTrimmed.length === EMPTY
          ) {
            return true;
          }

          // If any field is missing, this validation should pass (individual field validations will handle it)
          if (
            dayTrimmed.length === EMPTY ||
            monthTrimmed.length === EMPTY ||
            yearTrimmed.length === EMPTY
          ) {
            return true;
          }

          // Use validator.js isDate() with dateStringFromThreeFields helper
          const dateString = dateStringFromThreeFields(
            dayTrimmed,
            monthTrimmed,
            yearTrimmed,
          );

          return validator.isDate(dateString);
        },
      },
      in: ["body"],
    },
  });
