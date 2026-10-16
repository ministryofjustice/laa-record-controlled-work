import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Condition,
  Self,
  validation,
  type ValidationExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

const NON_WHITESPACE_REGEX =
  "[^\\t\\n\\v\\f\\r \\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]";

/**
 * Creates a nonblank validator rule for a GOV.UK form field. so empty and whitespace-only values produce one error, not two
 *
 * @param validationMessage - The translated error message shown when the field is empty.
 * @returns A validation expression that fails if the answer is blank.
 */
export function nonBlank(validationMessage: ResolvableString): ValidationExpr {
  return validation({
    condition: Self().match(
      Condition.String.MatchesRegex(NON_WHITESPACE_REGEX),
    ),
    message: validationMessage,
  });
}

/**
 * Creates a required-field validation rule for a GOV.UK form field.
 *
 * @param validationMessage - The translated error message shown when the field is empty.
 * @returns A validation expression that fails if the answer is blank.
 */
export function required(validationMessage: ResolvableString): ValidationExpr {
  return validation({
    condition: Self().match(Condition.IsRequired()),
    message: validationMessage,
  });
}
