import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Condition,
  Query,
  redirect,
  Self,
  validation,
  type ValidationExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { StepCode } from "#/journeys/StepCode.enum.js";

export const hasCheckAnswersInQuery = Query("returnTo").match(
  Condition.Equals(StepCode.CHECK_ANSWERS),
);

export const redirectToCheckAnswers = redirect({
  goto: StepCode.CHECK_ANSWERS,
  when: hasCheckAnswersInQuery,
});

/**
 * Creates a required-field validation rule for a GOV.UK form field.
 *
 * @param validationMessage - The translated error message shown when the field is empty.
 * @returns A validation expression that fails if the answer is blank.
 */
export function answerIsRequired(
  validationMessage: ResolvableString,
): ValidationExpr {
  return validation({
    condition: Self().match(Condition.IsRequired()),
    message: validationMessage,
  });
}
