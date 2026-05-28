export interface ErrorSummary {
  href?: string;
  text: string;
}

export interface FieldConfig {
  currentName?: string;
  field: string;
  includeExisting?: boolean;
  keepOriginal?: boolean;
  path?: string;
  type?: "array" | "boolean" | "number" | "string";
}

export interface FormField {
  existingValue: unknown;
  name: string;
  value: unknown;
}

export interface GetFormOptions {
  dataExtractor?: (data: unknown) => Record<string, unknown>;
  fieldConfigs?: FieldConfig[];
  templatePath: string;
}

export interface InputError {
  fieldName: string;
  text: string;
}

export interface PostFormOptions {
  apiUpdateData: Record<string, unknown>;
  fields: FormField[];
  templatePath: string;
}

export interface RenderData {
  [key: string]: unknown;
  caseReference: string;
  csrfToken?: string;
  error?: {
    errorSummaryList: ErrorSummary[];
    inputErrors: Record<string, string>;
  };
}
