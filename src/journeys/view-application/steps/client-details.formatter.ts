import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Data,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";

import {
  CLIENT_DETAILS_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";

/**
 * Formats a client's address for display.
 * @returns The formatted address HTML.
 */
export function formatAddress(): ResolvableString {
  return NunjucksGenerators.String({
    data: {
      country: Data(CONTEXT_DATA_KEYS.application).path(
        CLIENT_DETAILS_DATA_KEYS.country,
      ),
      county: Data(CONTEXT_DATA_KEYS.application).path(
        CLIENT_DETAILS_DATA_KEYS.county,
      ),
      line1: Data(CONTEXT_DATA_KEYS.application).path(
        CLIENT_DETAILS_DATA_KEYS.addressLine1,
      ),
      line2: Data(CONTEXT_DATA_KEYS.application).path(
        CLIENT_DETAILS_DATA_KEYS.addressLine2,
      ),
      line3: Data(CONTEXT_DATA_KEYS.application).path(
        CLIENT_DETAILS_DATA_KEYS.addressLine3,
      ),
      line4: Data(CONTEXT_DATA_KEYS.application).path(
        CLIENT_DETAILS_DATA_KEYS.addressLine4,
      ),
      postcode: Data(CONTEXT_DATA_KEYS.application).path(
        CLIENT_DETAILS_DATA_KEYS.postcode,
      ),
      town: Data(CONTEXT_DATA_KEYS.application).path(
        CLIENT_DETAILS_DATA_KEYS.townOrCity,
      ),
    },
    template: `
      {{ line1 }},<br />
      {% if line2 %}{{ line2 }},<br />{% endif %}
      {% if line3 %}{{ line3 }},<br />{% endif %}
      {% if line4 %}{{ line4 }},<br />{% endif %}
      {% if town %}{{ town }},<br />{% endif %}
      {% if county %}{{ county }},<br />{% endif %}
      {% if country and country != "United Kingdom" %}{{ country }}<br />{% endif %}
      {% if postcode %}{{ postcode }}<br />{% endif %}
    `,
  });
}

/**
 * Formats a date of birth for display.
 * @returns The formatted date of birth.
 */
export function formatDateOfBirth(): ResolvableString {
  return Data(CONTEXT_DATA_KEYS.application)
    .path(CLIENT_DETAILS_DATA_KEYS.dateOfBirth)
    .pipe(Transformer.String.ToDate(), Transformer.Date.Format("D MMMM YYYY"));
}
