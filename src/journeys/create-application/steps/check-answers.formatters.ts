import {
  Answer,
  Condition,
  match,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";

import { t } from "#/lib/i18n.js";

export const ecfLabel = match(Answer("ecf"))
  .branch(Condition.Equals("yes"), t("common.yes"))
  .otherwise(t("common.no"));

export const legalAidBeforeLabel = match(Answer("legalAidBefore"))
  .branch(
    Condition.Equals("yesSameMatter"),
    t("journeys.createApplication.legalAidBefore.radioButton.yesSameMatter"),
  )
  .branch(
    Condition.Equals("yesDifferentMatter"),
    t(
      "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
    ),
  )
  .otherwise(t("common.no"));

export const legalAidLast6MonthsLabel = match(Answer("legalAidLast6Months"))
  .branch(Condition.Equals("yes"), t("common.yes"))
  .otherwise(t("common.no"));

export const dateOfBirthDisplay = Answer("dateOfBirth").pipe(
  Transformer.String.ToDate(),
  Transformer.Date.Format("D MMMM YYYY"),
);

export const addressDisplay = NunjucksGenerators.String({
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

export const changeAddressRedirect = match(Answer("postcode"))
  .branch(
    Condition.IsRequired(),
    "enter-address-manually?returnTo=check-answers",
  )
  .otherwise("enter-overseas-address?returnTo=check-answers");

export const addressChangeHref = match(Answer("haveAHomeAddress"))
  .branch(Condition.Equals("no"), "have-a-home-address?returnTo=check-answers")
  .otherwise(changeAddressRedirect);

export const addressValueDisplay = match(Answer("haveAHomeAddress"))
  .branch(Condition.Equals("yes"), addressDisplay)
  .otherwise(
    t("journeys.createApplication.checkAnswers.answerValues.noFixedAddress"),
  );
