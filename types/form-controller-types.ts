import type { ErrorSummary } from './form-validation.js';

/**
 * Represents a form field with its current and existing values
 */
export interface FormField {
  name: string;
  value: unknown;
  existingValue: unknown;
}

/**
 * Data structure for rendering templates with error handling
 */
export interface RenderData {
  caseReference: string;
  error?: {
    inputErrors: Record<string, string>;
    errorSummaryList: ErrorSummary[];
  };
  csrfToken?: string;
  [key: string]: unknown;
}

/**
 * Field configuration for extracting data from API response
 */
export interface FieldConfig {
  field: string;
  path?: string;
  type?: 'string' | 'boolean' | 'number' | 'array';
  currentName?: string;
  keepOriginal?: boolean;
  includeExisting?: boolean;
}

/**
 * Configuration options for GET form handlers
 */
export interface GetFormOptions {
  templatePath: string;
  dataExtractor?: (data: unknown) => Record<string, unknown>;
  fieldConfigs?: FieldConfig[];
}

/**
 * Configuration options for POST form handlers
 */
export interface PostFormOptions {
  templatePath: string;
  fields: FormField[];
  apiUpdateData: Record<string, unknown>;
}
