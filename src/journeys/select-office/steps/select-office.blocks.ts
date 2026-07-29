import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

export const selectOfficeRadioInput = GovUKRadioInput({
  code: "selectOffice",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--l",
      isPageHeading: true,
      text: t("journeys.selectOffice.title"),
    },
  },
  items: [
    {
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
      message: t("journeys.selectOffice.validation.required"),
    }),
  ],
});
