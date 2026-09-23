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
  text: t("journeys.evidence.haveEvidenceOfExpenditure.description"),
  });
}

export function link() {
  return GovUKBody({
    text: `<a href="#" class="govuk-link">${t("journeys.evidence.haveEvidenceOfExpenditure.linkText")}</a>`,
  });
}

export function haveEvidenceOfExpenditureRadioInput() {
  return GovUKRadioInput({
    code: "haveEvidenceOfExpenditure",
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
          "journeys.evidence.haveEvidenceOfExpenditure.validation.required",
        ),
      }),
    ],
  });
}
