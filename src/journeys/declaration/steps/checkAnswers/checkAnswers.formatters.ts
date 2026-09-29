
import { AnswerKey } from "#/journeys/declaration/declaration.answers.js";  
import { Answer, Transformer } from "@ministryofjustice/hmpps-forge/core/authoring";
import { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

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