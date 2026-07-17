import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKCharacterCount,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "#/lib/i18n.js";

const REASON_MAX_LENGTH = 500;

export const reasonForNoEvidenceRadioInput = GovUKRadioInput({
  code: "reasonForNoEvidence",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--l",
      isPageHeading: true,
      text: t("journeys.evidence.reasonForNoEvidence.title"),
    },
  },
  items: [
    {
      text: t(
        "journeys.evidence.reasonForNoEvidence.options.notPossibleBeforeStart",
      ),
      value: "notPossibleBeforeStart",
    },
    {
      text: t("journeys.evidence.reasonForNoEvidence.options.adviceOverPhone"),
      value: "adviceOverPhone",
    },
    {
      text: t(
        "journeys.evidence.reasonForNoEvidence.options.personalCircumstances",
      ),
      value: "personalCircumstances",
    },
  ],
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: t("journeys.evidence.reasonForNoEvidence.validation.required"),
    }),
  ],
});

export const moreDetailsForNoEvidence = GovUKCharacterCount({
  code: "moreDetailsForNoEvidence",
  label: t("journeys.evidence.reasonForNoEvidence.moreDetails.label"),
  maxLength: REASON_MAX_LENGTH,
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: t(
        "journeys.evidence.reasonForNoEvidence.validation.moreDetailsRequired",
      ),
    }),
  ],
});
