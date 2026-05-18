import type { ErrorSummary } from "./form-validation.js";

/**
 * Field configuration for extracting data from API response
 */
export interface FieldConfig {
  currentName?: string;
  field: string;
  includeExisting?: boolean;
  keepOriginal?: boolean;
  path?: string;
  type?: "array" | "boolean" | "number" | "string";
}

/**
 * Represents a form field with its current and existing values
 */
export interface FormField {
  existingValue: unknown;
  name: string;
  value: unknown;
}

/**
 * Configuration options for GET form handlers
 */
export interface GetFormOptions {
  dataExtractor?: (data: unknown) => Record<string, unknown>;
  fieldConfigs?: FieldConfig[];
  templatePath: string;
}

/**
 * Configuration options for POST form handlers
 */
export interface PostFormOptions {
  apiUpdateData: Record<string, unknown>;
  fields: FormField[];
  templatePath: string;
}

/**
 * Data structure for rendering templates with error handling
 */
export interface RenderData {
  [key: string]: unknown;
  caseReference: string;
  csrfToken?: string;
  error?: {
    errorSummaryList: ErrorSummary[];
    inputErrors: Record<string, string>;
  };
}
