import type { ResolvableString } from "@ministryofjustice/hmpps-forge/core/components";

import {
  Answer,
  Condition,
  match,
  Transformer,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";

import { PriorLegalAid } from "#/api/clients/rcw/model/priorLegalAid.zod.gen.js";
import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
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
 * @param showIncomplete Whether unknown choices use the incomplete label.
 * @returns The address HTML or no-fixed-address text.
 */
export function formatAddressValue(showIncomplete = false): ResolvableString {
  const no = t(
    "journeys.createApplication.checkAnswers.answerValues.noFixedAddress",
  );

  return match(Answer(AnswerKey.haveAHomeAddress))
    .branch(Condition.Equals("yes"), addressFormatResolver())
    .branch(Condition.Equals("no"), no)
    .otherwise(showIncomplete ? formatIncompleteAnswerValue() : no);
}

/**
 * Formats the destination for an address change.
 * @returns The address entry URL.
 */
export function formatChangeAddressRedirect(): ResolvableString {
  return match(Answer(AnswerKey.haveAHomeAddress))
    .branch(Condition.Equals("yes"), addressStepResolver())
    .otherwise("have-a-home-address?returnTo=check-answers");
}

/**
 * Formats a date of birth for display.
 * @param showIncomplete Whether an invalid date uses the incomplete label.
 * @returns The formatted date of birth.
 */
export function formatDateOfBirth(showIncomplete = false): ResolvableString {
  const dateOfBirth = Answer(AnswerKey.dateOfBirth);
  const formattedDate = dateOfBirth.pipe(
    Transformer.String.ToDate(),
    Transformer.Date.Format("D MMMM YYYY"),
  );

  return showIncomplete
    ? match(dateOfBirth)
        .branch(Condition.Date.IsValid(), formattedDate)
        .otherwise(formatIncompleteAnswerValue())
    : formattedDate;
}

/**
 * Formats the ECF answer label.
 * @param showIncomplete Whether unknown answers use the incomplete label.
 * @returns The ECF answer label.
 */
export function formatEcfLabel(showIncomplete = false): ResolvableString {
  return formatYesNoAnswer(AnswerKey.ecf, showIncomplete);
}

/**
 * Formats the family law classification answer label.
 * @param showIncomplete Whether unknown answers use the incomplete label.
 * @returns The family law classification answer label.
 */
export function formatFamilyLawClassificationLabel(
  showIncomplete = false,
): ResolvableString {
  const publicLaw = t(
    "journeys.createApplication.familyLawClassification.radioButton.public",
  );
  const privateLaw = t(
    "journeys.createApplication.familyLawClassification.radioButton.private",
  );

  return match(Answer(AnswerKey.familyLawClassification))
    .branch(Condition.Equals("public"), publicLaw)
    .branch(Condition.Equals("private"), privateLaw)
    .otherwise(showIncomplete ? formatIncompleteAnswerValue() : privateLaw);
}

/**
 * Formats the incomplete answer as a GOV.UK blue status tag.
 * @returns Escaped status-tag HTML.
 */
export function formatIncompleteAnswerTag(): ResolvableString {
  return NunjucksGenerators.String({
    data: { text: formatIncompleteAnswerValue() },
    template: '<strong class="govuk-tag govuk-tag--blue">{{ text }}</strong>',
  });
}

/**
 * Formats the incomplete answer label.
 * @returns The localized incomplete label.
 */
export function formatIncompleteAnswerValue(): ResolvableString {
  return t("journeys.createApplication.checkAnswers.answerValues.incomplete");
}

/**
 * Formats the previous legal aid answer label.
 * @param showIncomplete Whether unknown answers use the incomplete label.
 * @returns The previous legal aid answer label.
 */
export function formatLegalAidBeforeLabel(
  showIncomplete = false,
): ResolvableString {
  const same = t(
    "journeys.createApplication.legalAidBefore.radioButton.yesSameMatter",
  );
  const different = t(
    "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
  );
  const no = t("common.no");

  return match(Answer(AnswerKey.legalAidBefore))
    .branch(Condition.Equals(PriorLegalAid.enum.yesSameMatter), same)
    .branch(Condition.Equals(PriorLegalAid.enum.yesDifferentMatter), different)
    .branch(Condition.Equals(PriorLegalAid.enum.no), no)
    .otherwise(showIncomplete ? formatIncompleteAnswerValue() : no);
}

/**
 * Formats the recent legal aid answer label.
 * @param showIncomplete Whether unknown answers use the incomplete label.
 * @returns The recent legal aid answer label.
 */
export function formatLegalAidLast6MonthsLabel(
  showIncomplete = false,
): ResolvableString {
  return formatYesNoAnswer(AnswerKey.legalAidLast6Months, showIncomplete);
}

/**
 * Formats a client's overseas address for display.
 * @returns The formatted address HTML.
 */
export function formatOsAddress(): ResolvableString {
  return NunjucksGenerators.String({
    data: {
      country: Answer(AnswerKey.osCountry),
      line1: Answer(AnswerKey.osAddressLine1),
      line2: Answer(AnswerKey.osAddressLine2),
      line3: Answer(AnswerKey.osAddressLine3),
      line4: Answer(AnswerKey.osAddressLine4),
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
 * Formats a required answer for an incomplete edit summary.
 * @param answerKey The answer to format.
 * @param showIncomplete Whether missing values use the incomplete label.
 * @returns The answer or incomplete label.
 */
export function formatRequiredAnswer(
  answerKey: AnswerKey,
  showIncomplete = false,
): ResolvableString {
  const answer = Answer(answerKey);

  return showIncomplete
    ? match(answer)
        .branch(Condition.IsRequired(), answer)
        .otherwise(formatIncompleteAnswerValue())
    : answer;
}

/**
 * Escapes text for display in a summary row's HTML value.
 * @param text The text to escape.
 * @returns Escaped HTML content.
 */
export function formatSummaryText(text: ResolvableString): ResolvableString {
  return NunjucksGenerators.String({
    data: { text },
    template: "{{ text }}",
  });
}

/**
 * Formats a client's UK address for display.
 * @returns The formatted address HTML.
 */
export function formatUkAddress(): ResolvableString {
  return NunjucksGenerators.String({
    data: {
      county: Answer(AnswerKey.ukCounty),
      line1: Answer(AnswerKey.ukAddressLine1),
      line2: Answer(AnswerKey.ukAddressLine2),
      postcode: Answer(AnswerKey.ukPostcode),
      town: Answer(AnswerKey.ukTownOrCity),
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
 * Formats a yes/no answer without treating unknown values as no in edit mode.
 * @param answerKey The yes/no answer to format.
 * @param showIncomplete Whether unknown values use the incomplete label.
 * @returns The localized answer.
 */
export function formatYesNoAnswer(
  answerKey: AnswerKey,
  showIncomplete: boolean,
): ResolvableString {
  const yes = t("common.yes");
  const no = t("common.no");

  return match(Answer(answerKey))
    .branch(Condition.Equals("yes"), yes)
    .branch(Condition.Equals("no"), no)
    .otherwise(showIncomplete ? formatIncompleteAnswerValue() : no);
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
