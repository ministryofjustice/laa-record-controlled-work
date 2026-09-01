import {
  Data,
  Format,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBody,
  GovUKButton,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import {
  APPLICATION_DATA_KEYS,
  APPLICATIONS_DATA_KEYS,
  CLIENT_DETAILS_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";
import { H1, H2 } from "#/lib/constants/headings.js";

const referenceNumber = Data(CONTEXT_DATA_KEYS.application).path(
  APPLICATION_DATA_KEYS.applicationRefNumber,
);

const recordedOnDate = Data(CONTEXT_DATA_KEYS.application)
  .path(APPLICATIONS_DATA_KEYS.modifiedAt)
  .pipe(
    Transformer.String.FormatDate({
      day: "numeric",
      locale: "en-GB",
      month: "short",
      timeZone: "Europe/London",
      year: "numeric",
    }),
  );

export const clientName = Format(
  "%1 %2",
  Data(CONTEXT_DATA_KEYS.application).path(CLIENT_DETAILS_DATA_KEYS.firstName),
  Data(CONTEXT_DATA_KEYS.application).path(CLIENT_DETAILS_DATA_KEYS.lastName),
);

/**
 * Builds a GovUKBody block for the case reference number.
 * @returns A GovUKBody block definition.
 */
export function caseReferenceNumber(): ReturnType<typeof GovUKBody> {
  return GovUKBody({
    classes: "govuk-!-margin-bottom-1",
    size: "l",
    text: Format("<strong>Reference number:</strong> %1", referenceNumber),
  });
}

/**
 * Builds a heading block.
 * @returns A heading block definition.
 */
export function heading(): ReturnType<typeof GovUKHeading> {
  return GovUKHeading({
    level: H1,
    size: "xl",
    text: clientName,
  });
}

/**
 * Builds a GovUKButton for printing the case, non functional.
 * @returns A GovUKButton block definition for printing the case.
 */
export function printButton(): GovUKButton {
  return GovUKButton({
    classes: "govuk-button--secondary",
    text: "Print this case",
  });
}

/**
 * Builds a GovUKBody block for the recorded on date.
 * @returns A GovUKBody block definition for the recorded on date.
 */
export function recordedOn(): ReturnType<typeof GovUKBody> {
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
export function statusTag(text: string): HtmlBlock {
  return HtmlBlock({
    content: `<div class="govuk-!-margin-bottom-4"><div class="govuk-tag govuk-tag--purple">${text}</div></div>`,
  });
}

/**
 *  Builds a subheading block.
 *  @param text - The text content for the subheading.
 *  @returns A subheading block definition.
 */
export function subHeading(text: string): ReturnType<typeof GovUKHeading> {
  return GovUKHeading({
    level: H2,
    size: "m",
    text,
  });
}
