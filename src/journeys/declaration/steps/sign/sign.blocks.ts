import type {
  HtmlBlock,
  TemplateWrapper,
} from "@ministryofjustice/hmpps-forge/core/components";

import {
  GovUKBody,
  GovUKButton,
  GovUKButtonGroup,
  GovUKCheckboxInput,
  GovUKDateInputFull,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1, H2 } from "#/lib/constants/headings.js";
import { t, tt } from "#/lib/i18n.js";

export const heading = (): HtmlBlock => {
  return GovUKHeading({
    level: H1,
    text: t("journeys.declaration.title"),
  });
};

export const statement = (): HtmlBlock[] => {
  const items = tt("journeys.declaration.sign.statement");
  return items.map((text) => GovUKBody({ text }));
};

export const downloadButton = (): GovUKButton => {
  return GovUKButton({
    text: t("journeys.declaration.sign.download"),
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
    code: "confirm",
    items: [
      {
        text: t("journeys.declaration.sign.confirmLabel"),
        value: "yes",
      },
    ],
  });
};

export const confirmSignedDate = (): GovUKDateInputFull => {
  return GovUKDateInputFull({
    code: "date",
    hint: t("journeys.declaration.sign.dateHint"),
    label: t("journeys.declaration.sign.dateLabel"),
  });
};

export const continueReturnButtons = (): TemplateWrapper => {
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
