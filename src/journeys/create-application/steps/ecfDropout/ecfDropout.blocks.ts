import type { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";

import { GovUKBody } from "@ministryofjustice/hmpps-forge/govuk-components";

import { tt } from "#/lib/i18n.js";

/**
 * Creates a body block with instructions to complete ECF application forms.
 *
 * @returns {HtmlBlock} A GovUK body component with ECF form completion instructions
 */
export function ecfDroupoutBody(): HtmlBlock[] {
  const items = tt("journeys.createApplication.ecfDropout.heading");
  return items.map((text) => GovUKBody({ text }));
}
