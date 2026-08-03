import {
  GovUKDateInputFull,
  GovUKUtilityClasses,
  GovUKValidations,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

const dobLabel = t(
  "journeys.createApplication.clientDetails.dateOfBirth.label",
);
const dobHint = t("journeys.createApplication.clientDetails.dateOfBirth.hint");
const dobEmpty = t(
  "journeys.createApplication.clientDetails.dateOfBirth.validation.empty",
);
const dobInvalid = t(
  "journeys.createApplication.clientDetails.dateOfBirth.validation.invalid",
);
const dobMissingDay = t(
  "journeys.createApplication.clientDetails.dateOfBirth.validation.missingDay",
);
const dobMissingMonth = t(
  "journeys.createApplication.clientDetails.dateOfBirth.validation.missingMonth",
);
const dobMissingYear = t(
  "journeys.createApplication.clientDetails.dateOfBirth.validation.missingYear",
);
const dobMustBePast = t(
  "journeys.createApplication.clientDetails.dateOfBirth.validation.mustBePast",
);

export const dateInput = GovUKDateInputFull({
  code: "dateOfBirth",
  fieldset: {
    legend: {
      classes: GovUKUtilityClasses.Fieldset.MediumLabel,
      isPageHeading: false,
      text: dobLabel,
    },
  },
  hint: {
    text: dobHint,
  },
  validWhen: [
    ...GovUKValidations.DateInputFull({
      empty: { message: dobEmpty },
      invalid: { message: dobInvalid },
      missingDay: { message: dobMissingDay },
      missingMonth: { message: dobMissingMonth },
      missingYear: { message: dobMissingYear },
      mustBePast: { message: dobMustBePast, submissionOnly: true },
    }),
  ],
});
