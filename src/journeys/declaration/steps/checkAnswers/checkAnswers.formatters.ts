import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Answer,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { AnswerKey } from "#/journeys/declaration/declaration.answers.js";

/**
 * Formats a date for display.
 * @returns The formatted date.
 */
export function formatDate(): ResolvableString {
  return Answer(AnswerKey.DECLARATION_SIGNED_DATE).pipe(
    Transformer.String.ToDate(),
    Transformer.Date.Format("D MMMM YYYY"),
  );
}
