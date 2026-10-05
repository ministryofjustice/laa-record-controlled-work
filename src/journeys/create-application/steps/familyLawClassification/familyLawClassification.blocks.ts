import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "i18next";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";

const QUESTION = t("journeys.createApplication.familyLawClassification.title");
const PUBLIC_ANSWER = t(
  "journeys.createApplication.familyLawClassification.radioButton.public",
);
const PRIVATE_ANSWER = t(
  "journeys.createApplication.familyLawClassification.radioButton.private",
);
const VALIDATION_REQUIRED_MESSAGE = t(
  "journeys.createApplication.familyLawClassification.validation.required",
);

/**
 * Renders the family law classification question as a radio input.
 * @returns GovUKRadioInput instance representing the family law classification question.
 */
export function familyLawQuestion(): GovUKRadioInput {
  return GovUKRadioInput({
    code: AnswerKey.familyLawClassification,
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--l",
        isPageHeading: true,
        text: QUESTION,
      },
    },
    items: [
      {
        text: PRIVATE_ANSWER,
        value: "private",
      },
      {
        text: PUBLIC_ANSWER,
        value: "public",
      },
    ],
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: VALIDATION_REQUIRED_MESSAGE,
      }),
    ],
  });
}
