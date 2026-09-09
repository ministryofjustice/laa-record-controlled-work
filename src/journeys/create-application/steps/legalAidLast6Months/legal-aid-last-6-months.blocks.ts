import {
  Answer,
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKCharacterCount,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { t } from "#/lib/i18n.js";

const REASON_MAX_LENGTH = 500;
const RADIO_QUESTION = t(
  "journeys.createApplication.legalAidLast6Months.title",
);
const TEXT_QUESTION = t(
  "journeys.createApplication.legalAidLast6Months.reasonForYes.hint",
);

const RADIO_VALIDATION = t(
  "journeys.createApplication.legalAidLast6Months.validation.required",
);
const TEXT_VALIDATION = t(
  "journeys.createApplication.legalAidLast6Months.validation.reasonRequired",
);

/**
 * Creates a GovUK-styled radio input for the legal aid in the last 6 months question.
 *
 * @returns {GovUKRadioInput} A GovUK radio input component with legal aid in the last 6 months options
 */
export function legalAidLast6MonthsRadioInput(): GovUKRadioInput {
  return GovUKRadioInput({
    code: AnswerKey.legalAidLast6Months,
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--l",
        isPageHeading: true,
        text: RADIO_QUESTION,
      },
    },
    items: [
      {
        block: reasonForYesTextInput(),
        text: t("common.yes"),
        value: "yes",
      },
      {
        text: t("common.no"),
        value: "no",
      },
    ],
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: t(RADIO_VALIDATION),
      }),
    ],
  });
}

/**
 * Creates a GovUK-styled character count input for the reason for yes question.
 *
 * @returns {GovUKCharacterCount} A GovUK character count input component for the reason for yes question
 */
function reasonForYesTextInput(): GovUKCharacterCount {
  return GovUKCharacterCount({
    code: AnswerKey.reasonForYes,
    dependentWhen: Answer(AnswerKey.legalAidLast6Months).match(
      Condition.Equals("yes"),
    ),
    label: TEXT_QUESTION,
    maxLength: REASON_MAX_LENGTH,
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: t(TEXT_VALIDATION),
      }),
    ],
  });
}
