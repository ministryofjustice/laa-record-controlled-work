import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerValue } from "#/journeys/AnswerValue.enum.js";
import { Answerkey } from "#/journeys/create-application/data/answers.zod.js";
import {
  differentMatter,
  legalAidBeforeTitle,
  legalAidBeforeValidation,
  sameMatter,
} from "#/journeys/create-application/steps/legalAidBefore/legalAidBefore.formatters.js";
import { t } from "#/lib/i18n.js";

export const legalAidBeforeRadioInput = (): GovUKRadioInput =>
  GovUKRadioInput({
    code: Answerkey.enum.legalAidBefore,
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
        value: AnswerValue.YES_SAME_MATTER,
      },
      {
        text: differentMatter,
        value: AnswerValue.YES_DIFFERENT_MATTER,
      },
      {
        text: t("common.no"),
        value: AnswerValue.NO,
      },
    ],
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: legalAidBeforeValidation,
      }),
    ],
  });
