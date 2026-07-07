import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import {
  GovUKBackLink,
  GovUKButton,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { t } from "#/lib/i18n.js";

export const govBackLink = GovUKBackLink({
  href: "/create-application/task-list",
});

export const caption = HtmlBlock({
  content: `<span class="govuk-caption-l">${t("journeys.evidence.caption")}</span>`,
});

export const doYouHaveEvidenceRadioInput = GovUKRadioInput({
  code: "doYouHaveEvidence",
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--l",
      isPageHeading: true,
      text: t("journeys.evidence.doYouHaveEvidence.title"),
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
      message: t("journeys.evidence.doYouHaveEvidence.validation.required"),
    }),
  ],
});

export const continueButton = GovUKButton({ text: t("common.continue") });
