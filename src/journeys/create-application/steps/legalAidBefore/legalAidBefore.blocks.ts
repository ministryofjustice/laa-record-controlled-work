import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import {
  differentMatter,
  legalAidBeforeTitle,
  legalAidBeforeValidation,
  sameMatter,
} from "#/journeys/create-application/steps/legalAidBefore/legalAidBefore.formatters.js";
import { t } from "#/lib/i18n.js";

export const legalAidBeforeRadioInput = (): GovUKRadioInput =>
  GovUKRadioInput({
    code: AnswerKey.legalAidBefore,
    fieldset: {
      legend: {
        classes: "govuk-fieldset__legend--l",
        isPageHeading: true,
        text: legalAidBeforeTitle,
      },
    },
    items: [
      {
        text: sameMatter,
        value: "yesSameMatter",
      },
      {
        text: differentMatter,
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
        message: legalAidBeforeValidation,
      }),
    ],
  });
