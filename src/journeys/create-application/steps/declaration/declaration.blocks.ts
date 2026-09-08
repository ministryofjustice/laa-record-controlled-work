import type { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";

import { GovUKBody } from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

const DECLARATION_BODY = t("journeys.createApplication.declaration.text");

/**
 * Renders the declaration consent body block for the create application journey.
 *
 * @returns {HtmlBlock} A GovUK-styled body component
 */
export function body(): HtmlBlock {
  return GovUKBody({
    classes: "govuk-body",
    text: DECLARATION_BODY,
  });
}
