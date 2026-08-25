import {
  APPLICATION_DATA_KEYS,
  CONTEXT_DATA_KEYS,
  PARAMS_KEYS,
} from "#/journeys/journey.constants.js";
import { Data, Params } from "@ministryofjustice/hmpps-forge/core/authoring";
import { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import { t } from "#/lib/i18n.js";

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
