import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Answer,
  Condition,
  match,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";

import { UK_ADDRESS_FIELDS } from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

const UNITED_KINGDOM = "United Kingdom";

/**
 * Decides which address formatter to use based on the country
 * @returns The formatted address
 */
export function addressFormatResolver(): ResolvableString {
  return match(Answer(UK_ADDRESS_FIELDS.country))
    .branch(Condition.Equals(UNITED_KINGDOM), formatUkAddress())
    .otherwise(formatOsAddress());
}

/**
 * Formats the address summary value.
 * @returns The address HTML or no-fixed-address text.
 */
export function formatAddressValue(): ResolvableString {
  const no = t(
    "journeys.createApplication.checkAnswers.answerValues.noFixedAddress",
  );

  return match(Answer("haveAHomeAddress"))
    .branch(Condition.Equals("yes"), addressFormatResolver())
    .otherwise(no);
}

/**
 * Formats the destination for an address change.
 * @returns The address entry URL.
 */
export function formatChangeAddressRedirect(): ResolvableString {
  return match(Answer("haveAHomeAddress"))
    .branch(Condition.Equals("yes"), addressStepResolver())
    .otherwise("have-a-home-address?returnTo=check-answers");
}

/**
 * Formats a date of birth for display.
 * @returns The formatted date of birth.
 */
export function formatDateOfBirth(): ResolvableString {
  return Answer("dateOfBirth").pipe(
    Transformer.String.ToDate(),
    Transformer.Date.Format("D MMMM YYYY"),
  );
}

/**
 * Formats the ECF answer label.
 * @returns The ECF answer label.
 */
export function formatEcfLabel(): ResolvableString {
  const yes = t("common.yes");
  const no = t("common.no");

  return match(Answer("ecf"))
    .branch(Condition.Equals("yes"), yes)
    .otherwise(no);
}

/**
 * Formats the previous legal aid answer label.
 * @returns The previous legal aid answer label.
 */
export function formatLegalAidBeforeLabel(): ResolvableString {
  const same = t(
    "journeys.createApplication.legalAidBefore.radioButton.yesSameMatter",
  );
  const different = t(
    "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
  );
  const no = t("common.no");

  return match(Answer("legalAidBefore"))
    .branch(Condition.Equals("yesSameMatter"), same)
    .branch(Condition.Equals("yesDifferentMatter"), different)
    .otherwise(no);
}

/**
 * Formats the recent legal aid answer label.
 * @returns The recent legal aid answer label.
 */
export function formatLegalAidLast6MonthsLabel(): ResolvableString {
  const yes = t("common.yes");
  const no = t("common.no");

  return match(Answer("legalAidLast6Months"))
    .branch(Condition.Equals("yes"), yes)
    .otherwise(no);
}

/**
 * Formats a client's overseas address for display.
 * @returns The formatted address HTML.
 */
export function formatOsAddress(): ResolvableString {
  return NunjucksGenerators.String({
    data: {
      country: Answer("osCountry"),
      line1: Answer("osAddressLine1"),
      line2: Answer("osAddressLine2"),
      line3: Answer("osAddressLine3"),
      line4: Answer("osAddressLine4"),
    },
    template: `
      {{ line1 }},<br />
      {% if line2 %}{{ line2 }},<br />{% endif %}
      {% if line3 %}{{ line3 }},<br />{% endif %}
      {% if line4 %}{{ line4 }},<br />{% endif %}
      {% if country %}{{ country }}<br />{% endif %}
    `,
  });
}

/**
 * Formats a client's UK address for display.
 * @returns The formatted address HTML.
 */
export function formatUkAddress(): ResolvableString {
  return NunjucksGenerators.String({
    data: {
      county: Answer("ukCounty"),
      line1: Answer("ukAddressLine1"),
      line2: Answer("ukAddressLine2"),
      postcode: Answer("ukPostcode"),
      town: Answer("ukTownOrCity"),
    },
    template: `
      {{ line1 }},<br />
      {% if line2 %}{{ line2 }},<br />{% endif %}
      {% if town %}{{ town }},<br />{% endif %}
      {% if county %}{{ county }},<br />{% endif %}
      {% if postcode %}{{ postcode }}<br />{% endif %}
    `,
  });
}

/**
 * Decides which address entry step a change link targets, based on the stored
 * address type.
 * @returns The address entry URL.
 */
function addressStepResolver(): ResolvableString {
  return match(Answer(UK_ADDRESS_FIELDS.country))
    .branch(
      Condition.Equals(UNITED_KINGDOM),
      "enter-address-manually?returnTo=check-answers",
    )
    .otherwise("enter-overseas-address?returnTo=check-answers");
}
