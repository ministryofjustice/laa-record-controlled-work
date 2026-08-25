import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import { Data } from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";

import {
  APPLICATION_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

/**
 *  format the reference number for the confirmation panel of the edit application journey.
 *  @returns ResolvableString with the body text and reference number for the confirmation panel.
 */
export function formatReferenceNumber(): ResolvableString {
  return NunjucksGenerators.String({
    data: {
      body: t("journeys.editApplication.confirmation.panel.body"),
      referenceNumber: Data(CONTEXT_DATA_KEYS.application).path(
        APPLICATION_DATA_KEYS.applicationRefNumber,
      ),
    },
    template: `
      {{ body }}<br />
      <strong>{{ referenceNumber }}</strong>
    `,
  });
}
