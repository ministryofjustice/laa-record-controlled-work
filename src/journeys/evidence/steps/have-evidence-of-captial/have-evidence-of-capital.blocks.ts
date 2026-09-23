import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { t } from "#/lib/i18n.js";

export function description() {
  return GovUKBody({
  classes: "govuk-body",
  text: t("journeys.evidence.haveEvidenceOfCapital.description"),
  });
}

export function haveEvidenceOfCapitalRadioInput() {
  return GovUKRadioInput({
    code: "haveEvidenceOfCapital",
    items: [
      {
        text: t("common.yes"),
        value: "yes",
      },
      {
        text: t("journeys.evidence.haveEvidenceOfExpenditure.options.no"),
        value: "no",
      },
    ],
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: t(
          "journeys.evidence.haveEvidenceOfCapital.validation.required",
        ),
      }),
    ],
  });
}
