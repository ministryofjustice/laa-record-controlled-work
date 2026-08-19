import { Format } from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock, ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";
import { GovUKBody, GovUKButton, GovUKHeading } from "@ministryofjustice/hmpps-forge/govuk-components";

/**
 * Builds a GovUKBody block for the case reference number.
 * @param caseRefNumber - The text content for the Body.
 * @returns A GovUKBody block definition.
 */
export function caseReferenceNumber(
  caseRefNumber: ResolvableString,
): ReturnType<typeof GovUKBody> {
  return GovUKBody({ 
    text: Format("<strong>Reference number:</strong> %1", caseRefNumber),
    size: "l",
    classes: "govuk-!-margin-bottom-1"
  });
}

export function recordedOn(
  recordedOnDate: ResolvableString,
): ReturnType<typeof GovUKBody> {
  return GovUKBody({ 
    text: Format("<strong>Recorded on:</strong> %1", recordedOnDate),
    size: "l",
    classes: "govuk-!-margin-bottom-1"
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
    text: text,
    size: "xl"
  });
}

/**
 * Builds a status tag block.
 * @param text - The text content for the status tag.
 * @returns A status tag block definition.
 */
export function statusTag(
  text: ResolvableString,
): ReturnType<typeof HtmlBlock> {
  return HtmlBlock({
    content: `<div class="govuk-!-margin-bottom-4"><div class="govuk-tag govuk-tag--purple">${text}</div></div>`,
  });
}

/**
 * Builds a GovUKButton for printing the case, non functional.
 * @returns A GovUKButton block definition for printing the case.
 */
export function printButton(): ReturnType<typeof GovUKButton> {
  return GovUKButton({
    text: "Print this case",
    classes: "govuk-button--secondary"
  });
} 