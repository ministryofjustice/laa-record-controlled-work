import { Format } from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  HtmlBlock,
  type ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBody,
  GovUKButton,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

/**
 * Builds a GovUKBody block for the case reference number.
 * @param caseRefNumber - The text content for the Body.
 * @returns A GovUKBody block definition.
 */
export function caseReferenceNumber(
  caseRefNumber: ResolvableString,
): ReturnType<typeof GovUKBody> {
  return GovUKBody({
    classes: "govuk-!-margin-bottom-1",
    size: "l",
    text: Format("<strong>Reference number:</strong> %1", caseRefNumber),
  });
}

/**
 * Builds a heading block.
 * @param text - The text content for the heading.
 * @returns A heading block definition.
 */
export function heading(
  text: ResolvableString,
): ReturnType<typeof GovUKHeading> {
  return GovUKHeading({
    size: "xl",
    text,
  });
}

/**
 * Builds a GovUKButton for printing the case, non functional.
 * @returns A GovUKButton block definition for printing the case.
 */
export function printButton(): ReturnType<typeof GovUKButton> {
  return GovUKButton({
    classes: "govuk-button--secondary",
    text: "Print this case",
  });
}

/**
 * Builds a GovUKBody block for the recorded on date.
 * @param recordedOnDate - The text content for the recorded on date.
 * @returns A GovUKBody block definition for the recorded on date.
 */
export function recordedOn(
  recordedOnDate: ResolvableString,
): ReturnType<typeof GovUKBody> {
  return GovUKBody({
    size: "l",
    text: Format("<strong>Recorded on:</strong> %1", recordedOnDate),
  });
}

/**
 * Builds a status tag block.
 * @param text - The text content for the status tag.
 * @returns A status tag block definition.
 */
export function statusTag(
  text: string,
): ReturnType<typeof HtmlBlock> {
  return HtmlBlock({
    content: `<div class="govuk-!-margin-bottom-4"><div class="govuk-tag govuk-tag--purple">${text}</div></div>`,
  });
}
