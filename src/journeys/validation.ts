import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Condition,
  Self,
  validation,
  type ValidationExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { NonblankStringRegExp } from "#/api/clients/rcw/model/nonblankString.zod.gen.js";

/**
 * Creates a nonblank validator rule for a GOV.UK form field. so empty and whitespace-only values produce one error, not two
 *
 * @param validationMessage - The translated error message shown when the field is empty.
 * @returns A validation expression that fails if the answer is blank.
 */
export function nonBlank(validationMessage: ResolvableString): ValidationExpr {
  return validation({
    condition: Self().match(
      Condition.String.MatchesRegex(NonblankStringRegExp.source),
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
