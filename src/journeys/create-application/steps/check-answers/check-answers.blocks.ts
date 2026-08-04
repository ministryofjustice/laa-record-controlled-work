import {
  Answer,
  Condition,
  match,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import { GovUKSummaryList } from "@ministryofjustice/hmpps-forge/govuk-components";

import { ANSWER_CODES, ANSWER_VALUES } from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

const changeButtonText = t("common.change");
const noText = t("common.no");
const yesText = t("common.yes");
const addressLabel = t(
  "journeys.createApplication.checkAnswers.answerLabels.address",
);
const dateOfBirthLabel = t(
  "journeys.createApplication.checkAnswers.answerLabels.dateOfBirth",
);
const ecfAnswerLabel = t(
  "journeys.createApplication.checkAnswers.answerLabels.ecf",
);
const firstNameLabel = t(
  "journeys.createApplication.checkAnswers.answerLabels.firstName",
);
const lastNameLabel = t(
  "journeys.createApplication.checkAnswers.answerLabels.lastName",
);
const legalAidBeforeAnswerLabel = t(
  "journeys.createApplication.checkAnswers.answerLabels.legalAidBefore",
);
const legalAidLast6MonthsAnswerLabel = t(
  "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6Months",
);
const legalAidLast6MonthsReasonForYesLabel = t(
  "journeys.createApplication.checkAnswers.answerLabels.legalAidLast6MonthsReasonForYes",
);
const niNumberLabel = t(
  "journeys.createApplication.checkAnswers.answerLabels.niNumber",
);
const yesDifferentMatterText = t(
  "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
);
const yesSameMatterText = t(
  "journeys.createApplication.legalAidBefore.radioButton.yesSameMatter",
);

const ecfLabel = match(Answer(ANSWER_CODES.ecf))
  .branch(Condition.Equals(ANSWER_VALUES.yes), yesText)
  .otherwise(noText);

const legalAidBeforeLabel = match(Answer(ANSWER_CODES.legalAidBefore))
  .branch(Condition.Equals(ANSWER_VALUES.yesSameMatter), yesSameMatterText)
  .branch(
    Condition.Equals(ANSWER_VALUES.yesDifferentMatter),
    yesDifferentMatterText,
  )
  .otherwise(noText);

const legalAidLast6MonthsLabel = match(Answer(ANSWER_CODES.legalAidLast6Months))
  .branch(Condition.Equals(ANSWER_VALUES.yes), yesText)
  .otherwise(noText);

const dateOfBirthDisplay = Answer(ANSWER_CODES.dateOfBirth).pipe(
  Transformer.String.ToDate(),
  Transformer.Date.Format("D MMMM YYYY"),
);

const addressDisplay = NunjucksGenerators.String({
  data: {
    country: Answer(ANSWER_CODES.country),
    county: Answer(ANSWER_CODES.county),
    line1: Answer(ANSWER_CODES.addressLine1),
    line2: Answer(ANSWER_CODES.addressLine2),
    line3: Answer(ANSWER_CODES.addressLine3),
    line4: Answer(ANSWER_CODES.addressLine4),
    postcode: Answer(ANSWER_CODES.postcode),
    town: Answer(ANSWER_CODES.townOrCity),
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

const changeAddressRedirect = match(Answer(ANSWER_CODES.postcode))
  .branch(
    Condition.IsRequired(),
    "enter-address-manually?returnTo=check-answers",
  )
  .otherwise("enter-overseas-address?returnTo=check-answers");

const rows = [
  {
    href: "ecf?returnTo=check-answers",
    label: ecfAnswerLabel,
    value: { text: ecfLabel },
  },
  {
    href: "legal-aid-before?returnTo=check-answers",
    label: legalAidBeforeAnswerLabel,
    value: { text: legalAidBeforeLabel },
  },
  {
    href: "legal-aid-last-6-months?returnTo=check-answers",
    label: legalAidLast6MonthsAnswerLabel,
    value: { text: legalAidLast6MonthsLabel },
    visibleWhen: Answer(ANSWER_CODES.legalAidBefore).match(
      Condition.Equals(ANSWER_VALUES.yesSameMatter),
    ),
  },
  {
    href: "legal-aid-last-6-months?returnTo=check-answers",
    label: legalAidLast6MonthsReasonForYesLabel,
    value: { text: Answer(ANSWER_CODES.reasonForYes) },
    visibleWhen: Answer(ANSWER_CODES.legalAidLast6Months).match(
      Condition.Equals(ANSWER_VALUES.yes),
    ),
  },
  {
    href: "client-details?returnTo=check-answers",
    label: firstNameLabel,
    value: { text: Answer(ANSWER_CODES.firstName) },
  },
  {
    href: "client-details?returnTo=check-answers",
    label: lastNameLabel,
    value: { text: Answer(ANSWER_CODES.lastName) },
  },
  {
    href: "client-details?returnTo=check-answers",
    label: dateOfBirthLabel,
    value: { text: dateOfBirthDisplay },
  },
  {
    href: "ni-number?returnTo=check-answers",
    label: niNumberLabel,
    value: { text: Answer(ANSWER_CODES.niNumber) },
    visibleWhen: Answer(ANSWER_CODES.hasNINumber).match(
      Condition.Equals(ANSWER_VALUES.yes),
    ),
  },
  {
    href: changeAddressRedirect,
    label: addressLabel,
    value: { html: addressDisplay },
    visibleWhen: Answer(ANSWER_CODES.haveAHomeAddress).match(
      Condition.Equals(ANSWER_VALUES.yes),
    ),
  },
];

export const summaryList = GovUKSummaryList({
  rows: rows.map(({ href, label, value, visibleWhen }) => ({
    actions: {
      items: [
        {
          href,
          text: changeButtonText,
          visuallyHiddenText: label,
        },
      ],
    },
    key: { text: label },
    value,
    ...(visibleWhen ? { visibleWhen } : {}),
  })),
});
