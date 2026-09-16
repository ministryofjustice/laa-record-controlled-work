import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKDateInputFull,
  GovUKTextInput,
  GovUKUtilityClasses,
  GovUKValidations,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { t } from "#/lib/i18n.js";

const FIRST_NAME_QUESTION = t(
  "journeys.createApplication.clientDetails.firstName.label",
);
const FIRST_NAME_VALIDATION = t(
  "journeys.createApplication.clientDetails.firstName.validation.required",
);

const LAST_NAME_QUESTION = t(
  "journeys.createApplication.clientDetails.lastName.label",
);
const LAST_NAME_VALIDATION = t(
  "journeys.createApplication.clientDetails.lastName.validation.required",
);

const DOB_QUESTION = t(
  "journeys.createApplication.clientDetails.dateOfBirth.label",
);
const DOB_HINT = t("journeys.createApplication.clientDetails.dateOfBirth.hint");
const DOB_VALIDATION = {
  AGE_LIMIT: t(
    "journeys.createApplication.clientDetails.dateOfBirth.validation.ageLimit",
  ),
  EMPTY: t(
    "journeys.createApplication.clientDetails.dateOfBirth.validation.empty",
  ),
  INVALID: t(
    "journeys.createApplication.clientDetails.dateOfBirth.validation.invalid",
  ),
  MISSING_DAY: t(
    "journeys.createApplication.clientDetails.dateOfBirth.validation.missingDay",
  ),
  MISSING_MONTH: t(
    "journeys.createApplication.clientDetails.dateOfBirth.validation.missingMonth",
  ),
  MISSING_YEAR: t(
    "journeys.createApplication.clientDetails.dateOfBirth.validation.missingYear",
  ),
  MUST_BE_PAST: t(
    "journeys.createApplication.clientDetails.dateOfBirth.validation.mustBePast",
  ),
};

/**
 * Creates a GovUK-styled date input for the date of birth question.
 *
 * @returns {GovUKDateInputFull} A GovUK date input component for the date of birth question
 */
export function dateOfBirthInput(): GovUKDateInputFull {
  return GovUKDateInputFull({
    code: AnswerKey.dateOfBirth,
    fieldset: {
      legend: {
        classes: GovUKUtilityClasses.Fieldset.MediumLabel,
        isPageHeading: false,
        text: DOB_QUESTION,
      },
    },
    hint: {
      text: DOB_HINT,
    },
    validWhen: [
      ...GovUKValidations.DateInputFull({
        empty: {
          message: DOB_VALIDATION.EMPTY,
        },
        invalid: {
          message: DOB_VALIDATION.INVALID,
        },
        missingDay: {
          message: DOB_VALIDATION.MISSING_DAY,
        },
        missingMonth: {
          message: DOB_VALIDATION.MISSING_MONTH,
        },
        missingYear: {
          message: DOB_VALIDATION.MISSING_YEAR,
        },
        mustBePast: {
          message: DOB_VALIDATION.MUST_BE_PAST,
          submissionOnly: true,
        },
      }),
      validation({
        condition: Self().match(Condition.Date.IsAfter("1900-01-01")),
        message: DOB_VALIDATION.AGE_LIMIT,
      }),
    ],
  });
}

/**
 * Creates a GovUK-styled text input for the first name question.
 *
 * @returns {GovUKTextInput} A GovUK text input component for the first name question
 */
export function firstNameInput(): GovUKTextInput {
  return GovUKTextInput({
    code: AnswerKey.firstName,
    label: {
      classes: "govuk-label--m",
      isPageHeading: false,
      text: FIRST_NAME_QUESTION,
    },
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: FIRST_NAME_VALIDATION,
      }),
    ],
  });
}

/**
 * Creates a GovUK-styled text input for the last name question.
 *
 * @returns {GovUKTextInput} A GovUK text input component for the last name question
 */
export function lastNameInput(): GovUKTextInput {
  return GovUKTextInput({
    code: AnswerKey.lastName,
    label: {
      classes: "govuk-label--m",
      isPageHeading: false,
      text: LAST_NAME_QUESTION,
    },
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: LAST_NAME_VALIDATION,
      }),
    ],
  });
}
