import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.haveAHomeAddress.title");
const HINT = t("journeys.createApplication.haveAHomeAddress.hint");
const NO_TEXT = t("journeys.createApplication.haveAHomeAddress.radioButton.no");
const REQUIRED_VALIDATION = t(
  "journeys.createApplication.haveAHomeAddress.validation.required",
);

/**
 * Creates the home address question and its yes/no options.
 *
 * @returns A GovUK radio input for the home address question.
 */
export function haveAHomeAddressQuestion(): GovUKRadioInput {
  return GovUKRadioInput({
    code: AnswerKey.haveAHomeAddress,
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--l",
        isPageHeading: true,
        text: TITLE,
      },
    },
    hint: { text: HINT },
    items: [
      {
        text: t("common.yes"),
        value: "yes",
      },
      {
        text: NO_TEXT,
        value: "no",
      },
    ],
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: REQUIRED_VALIDATION,
      }),
    ],
  });
}
