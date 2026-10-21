import type { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";

import {
  GovUKBody,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1, H2 } from "#/lib/constants/headings.js";
import { fixedT, tt } from "#/lib/i18n.js";

const pathT = fixedT("journeys.createApplication.familyPrivateNotInScope");

const TITLE = pathT("title");
const ECF_TITLE = pathT("exceptionalCaseFunding.title");
const ECF_GUIDANCE = pathT("exceptionalCaseFunding.guidance");
const ECF_LINK = pathT("exceptionalCaseFunding.link");

/**
 * Creates a body block with guidance for the Exceptional Case Funding (ECF) section.
 *
 * @returns {HtmlBlock[]} An array of GovUK body components with ECF guidance text.
 */
export function ecfInfo(): GovUKBody {
  return GovUKBody({ text: ECF_GUIDANCE });
}

/**
 * Creates a link block for the Exceptional Case Funding (ECF) section.
 *
 * @returns {HtmlBlock} A GovUK body component with a link to the ECF guidance.
 */
export function ecfLink(): GovUKBody {
  return GovUKBody({ text: ECF_LINK });
}

/**
 * Creates the heading for the Exceptional Case Funding (ECF) section.
 *
 * @returns A GovUK heading component with the ECF section title.
 */
export function ecfTitle(): GovUKHeading {
  return GovUKHeading({
    classes: "govuk-heading-m",
    level: H2,
    text: ECF_TITLE,
  });
}
/**
 * Creates a body block with guidance about scope.
 *
 *  @returns array of GovUKBody components with the text for each statement.
 */
export function guidance(): HtmlBlock[] {
  const items = tt(
    "journeys.createApplication.familyPrivateNotInScope.guidance",
  );
  return items.map((text) => GovUKBody({ text }));
}

/**
 * Creates the heading for the International Maintenance Agreement question step.
 *
 * @returns A GovUK heading component with the step title.
 */
export function heading(): GovUKHeading {
  return GovUKHeading({
    level: H1,
    text: TITLE,
  });
}
