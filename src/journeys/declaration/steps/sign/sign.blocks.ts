import type {
  BlockDefinition,
  HtmlBlock,
} from "@ministryofjustice/hmpps-forge/core/components";

import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKButton,
  GovUKButtonGroup,
  GovUKCheckboxInput,
  GovUKDateInputFull,
  GovUKHeading,
  GovUKValidations,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey as A } from "#/journeys/AnswerKey.js";
import { H1, H2 } from "#/lib/constants/headings.js";
import { t, tt } from "#/lib/i18n.js";

export const heading = (): HtmlBlock => {
  return GovUKHeading({
    level: H1,
    text: t("journeys.declaration.sign.title"),
  });
};

export const statement = (): HtmlBlock[] => {
  const items = tt("journeys.declaration.sign.statement");
  return items.map((text) => GovUKBody({ text }));
};

export const downloadButton = (): GovUKButton => {
  return GovUKButton({
    text: t("journeys.declaration.sign.download"),
    value: "download-pdf",
  });
};

export const confirmHeading = (): HtmlBlock => {
  return GovUKHeading({
    classes: "govuk-heading-m",
    level: H2,
    text: t("journeys.declaration.sign.confirmHeading"),
  });
};

export const confirmSignedCheckbox = (): GovUKCheckboxInput => {
  return GovUKCheckboxInput({
    code: A.DECLARATION_SIGNED_CONFIRM,
    items: [
      {
        text: t("journeys.declaration.sign.confirmLabel"),
        value: "yes",
      },
    ],
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: t("journeys.declaration.sign.error.confirmRequired"),
      }),
    ],
  });
};

export const confirmSignedDate = (): GovUKDateInputFull => {
  return GovUKDateInputFull({
    code: A.DECLARATION_SIGNED_DATE,
    hint: t("journeys.declaration.sign.dateHint"),
    label: t("journeys.declaration.sign.dateLabel"),
    validWhen: GovUKValidations.DateInputFull({
      empty: {
        message: t("journeys.declaration.sign.error.dateRequired"),
      },
      invalid: {
        message: t("journeys.declaration.sign.error.dateInvalid"),
      },
      missingDay: {
        message: t("journeys.declaration.sign.error.missingDay"),
      },
      missingMonth: {
        message: t("journeys.declaration.sign.error.missingMonth"),
      },
      missingYear: {
        message: t("journeys.declaration.sign.error.missingYear"),
      },
    }),
  });
};

export const continueReturnButtons = (): BlockDefinition => {
  return GovUKButtonGroup({
    buttons: [
      GovUKButton({
        buttonType: "submit",
        text: t("journeys.declaration.sign.continueButton"),
        value: "continue",
      }),
      GovUKButton({
        buttonType: "submit",
        classes: "govuk-button--secondary",
        text: t("common.saveAndReturn"),
        value: "return",
      }),
    ],
  });
};
