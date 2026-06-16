import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

/**
 *
 */
export function legalAidBeforeRadioButtons(): GovUKRadioInput {
  return GovUKRadioInput({
    code: "legalAidBefore",
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--l",
        isPageHeading: true,
        text: t("journeys.createApplication.legalAidBefore.title"),
      },
    },
    items: [
      {
        text: t(
          "journeys.createApplication.legalAidBefore.radioButton.yesSameMatter",
        ),
        value: "yesSameMatter",
      },
      {
        text: t(
          "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
        ),
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
        message: t(
          "journeys.createApplication.legalAidBefore.validation.required",
        ),
      }),
    ],
  });
}
