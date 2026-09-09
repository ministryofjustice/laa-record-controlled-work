import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { t } from "#/lib/i18n.js";

const QUESTION = t("journeys.createApplication.legalAidBefore.title");
const SAME_MATTER = t(
  "journeys.createApplication.legalAidBefore.radioButton.yesSameMatter",
);
const DIFFERENT_MATTER = t(
  "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
);

const VALIDATION_MESSAGE = t(
  "journeys.createApplication.legalAidBefore.validation.required",
);

/**
 * Creates a GovUK-styled radio input for the legal aid history question.
 *
 * @returns {GovUKRadioInput} A GovUK radio input component with legal aid history options
 */
export function legalAidBeforeRadioInput(): GovUKRadioInput {
  return GovUKRadioInput({
    code: AnswerKey.legalAidBefore,
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--l",
        isPageHeading: true,
        text: QUESTION,
      },
    },
    items: [
      {
        text: SAME_MATTER,
        value: "yesSameMatter",
      },
      {
        text: DIFFERENT_MATTER,
        value: "yesDifferentMatter",
      },
      {
        text: t("common.no"),
        value: "no",
      },
    ],
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: VALIDATION_MESSAGE,
      }),
    ],
  });
}
