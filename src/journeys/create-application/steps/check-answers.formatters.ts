import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Answer,
  Condition,
  match,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";

import { t } from "#/lib/i18n.js";

/**
 * Formats a client's address for display.
 * @returns The formatted address HTML.
 */
export function formatAddress(): ResolvableString {
  return NunjucksGenerators.String({
    data: {
      country: Answer("country"),
      county: Answer("county"),
      line1: Answer("addressLine1"),
      line2: Answer("addressLine2"),
      line3: Answer("addressLine3"),
      line4: Answer("addressLine4"),
      postcode: Answer("postcode"),
      town: Answer("townOrCity"),
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
 * Formats the address change link.
 * @returns The address change URL.
 */
export function formatAddressChangeHref(): ResolvableString {
  return match(Answer("haveAHomeAddress"))
    .branch(
      Condition.Equals("no"),
      "have-a-home-address?returnTo=check-answers",
    )
    .otherwise(formatChangeAddressRedirect());
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
    .branch(Condition.Equals("yes"), formatAddress())
    .otherwise(no);
}

/**
 * Formats the destination for an address change.
 * @returns The address entry URL.
 */
export function formatChangeAddressRedirect(): ResolvableString {
  return match(Answer("postcode"))
    .branch(
      Condition.IsRequired(),
      "enter-address-manually?returnTo=check-answers",
    )
    .otherwise("enter-overseas-address?returnTo=check-answers");
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
