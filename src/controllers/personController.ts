import type { NextFunction, Request, Response } from "express";

import { validationResult } from "express-validator";

import { BAD_REQUEST } from "#/lib/constants/httpStatus.js";
import { extractFormFields } from "#/lib/dataTransformers.js";
import {
  getSessionData,
  storeOriginalFormData,
  storeSessionData,
} from "#/lib/sessionHelpers.js";
import { formatValidationErrors } from "#/lib/ValidationErrorHelpers.js";

// Extend Request interface for CSRF token support
interface RequestWithCSRF extends Request {
  csrfToken?: () => string;
}

// Default person data (in a real app, this would be from a database)
const DEFAULT_PERSON_DATA = {
  address: "123 Example Street\nExample City\nEX1 2MP",
  contactPreference: "email",
  dateOfBirth: { day: "27", month: "3", year: "1986" },
  fullName: "John Smith",
  priority: "medium",
};

/**
 * GET controller for rendering the person change form
 * @param {RequestWithCSRF} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function getPerson(
  req: RequestWithCSRF,
  res: Response,
  next: NextFunction,
): void {
  try {
    const csrfToken =
      typeof req.csrfToken === "function" ? req.csrfToken() : undefined;
    const currentPersonData = getCurrentPersonData(req);

    // Store original form data for comparison (following MCC pattern)
    const originalFormData = {
      address: currentPersonData.address,
      contactPreference: currentPersonData.contactPreference,
      "dateOfBirth-day": currentPersonData.dateOfBirth.day,
      "dateOfBirth-month": currentPersonData.dateOfBirth.month,
      "dateOfBirth-year": currentPersonData.dateOfBirth.year,
      fullName: currentPersonData.fullName,
      priority: currentPersonData.priority,
    };
    storeOriginalFormData(req, "personOriginal", originalFormData);

    res.render("change-person.njk", {
      csrfToken,
      currentAddress: currentPersonData.address,
      currentContactPreference: currentPersonData.contactPreference,
      currentDateOfBirth: currentPersonData.dateOfBirth,
      currentName: currentPersonData.fullName,
      currentPriority: currentPersonData.priority,
      error: null,
      formData: {},
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST controller for handling person change requests
 * Processes validation results and formats errors for GOV.UK component display
 * @param {RequestWithCSRF} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function postPerson(
  req: RequestWithCSRF,
  res: Response,
  next: NextFunction,
): void {
  try {
    const csrfToken =
      typeof req.csrfToken === "function" ? req.csrfToken() : undefined;

    // Extract form fields for consistent handling
    const formFields = extractFormFields(req.body, [
      "fullName",
      "address",
      "contactPreference",
      "priority",
      "dateOfBirth-day",
      "dateOfBirth-month",
      "dateOfBirth-year",
    ]);

    // Check for validation errors
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      // Use the new formatValidationErrors helper
      const { errorSummaryList, inputErrors } =
        formatValidationErrors(validationErrors);
      const currentPersonData = getCurrentPersonData(req);

      // Re-render the form with errors and preserve user input
      res.status(BAD_REQUEST).render("change-person.njk", {
        csrfToken,
        currentAddress: currentPersonData.address,
        currentContactPreference: currentPersonData.contactPreference,
        currentDateOfBirth: currentPersonData.dateOfBirth,
        currentName: currentPersonData.fullName,
        currentPriority: currentPersonData.priority,
        error: {
          errorSummaryList,
          inputErrors,
        },
        formData: formFields,
      });
      return;
    }

    // Success case - update the stored person data and show success
    const updatedPersonData = {
      address: String(formFields.address),
      contactPreference: String(formFields.contactPreference),
      "dateOfBirth-day": String(formFields["dateOfBirth-day"]),
      "dateOfBirth-month": String(formFields["dateOfBirth-month"]),
      "dateOfBirth-year": String(formFields["dateOfBirth-year"]),
      fullName: String(formFields.fullName),
    };

    // Store the updated data in session
    storeSessionData(req, "currentPerson", updatedPersonData);

    // Get the updated data for display
    const currentPersonData = getCurrentPersonData(req);

    // Render the form again with the updated data and success state
    res.render("change-person.njk", {
      csrfToken,
      currentAddress: currentPersonData.address,
      currentContactPreference: currentPersonData.contactPreference,
      currentDateOfBirth: currentPersonData.dateOfBirth,
      currentName: currentPersonData.fullName,
      currentPriority: currentPersonData.priority,
      error: null,
      formData: {
        address: "",
        contactPreference: "",
        "dateOfBirth-day": "",
        "dateOfBirth-month": "",
        "dateOfBirth-year": "",
        fullName: "",
        priority: "",
      }, // Clear the form
      successMessage: "Person details updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current person data from session or return defaults
 * @param {Request} req - Express request object with session
 * @returns {object} Current person data matching DEFAULT_PERSON_DATA structure
 */
function getCurrentPersonData(req: Request): typeof DEFAULT_PERSON_DATA {
  const sessionData = getSessionData(req, "currentPerson");
  if (sessionData !== null) {
    return {
      address: safeStringValue(
        sessionData.address,
        DEFAULT_PERSON_DATA.address,
      ),
      contactPreference: safeStringValue(
        sessionData.contactPreference,
        DEFAULT_PERSON_DATA.contactPreference,
      ),
      dateOfBirth: safeDateOfBirth(sessionData.dateOfBirth),
      fullName: safeStringValue(
        sessionData.fullName,
        DEFAULT_PERSON_DATA.fullName,
      ),
      priority: safeStringValue(
        sessionData.priority,
        DEFAULT_PERSON_DATA.priority,
      ),
    };
  }
  return DEFAULT_PERSON_DATA;
}

/**
 * Safely gets date of birth object or returns default
 * @param {unknown} value - The date of birth value to check
 * @returns {{ day: string; month: string; year: string }} The safe date of birth object
 */
function safeDateOfBirth(value: unknown): {
  day: string;
  month: string;
  year: string;
} {
  if (
    typeof value === "object" &&
    value !== null &&
    "day" in value &&
    "month" in value &&
    "year" in value
  ) {
    const dob = value;
    return {
      day:
        typeof dob.day === "string"
          ? dob.day
          : DEFAULT_PERSON_DATA.dateOfBirth.day,
      month:
        typeof dob.month === "string"
          ? dob.month
          : DEFAULT_PERSON_DATA.dateOfBirth.month,
      year:
        typeof dob.year === "string"
          ? dob.year
          : DEFAULT_PERSON_DATA.dateOfBirth.year,
    };
  }
  return DEFAULT_PERSON_DATA.dateOfBirth;
}

/**
 * Safely gets a string value from session data or returns default
 * @param {unknown} value - The value to check
 * @param {string} defaultValue - The default value to use
 * @returns {string} The safe string value
 */
function safeStringValue(value: unknown, defaultValue: string): string {
  return typeof value === "string" && value !== "" ? value : defaultValue;
}
