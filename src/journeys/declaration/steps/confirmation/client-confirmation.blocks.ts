import {
  GovUKBody,
  GovUKHeading,
  GovUKWarningText,
  GovUKButton,
  GovUKButtonGroup,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { i18next, t } from "#/lib/i18n.js";
import { H1 } from "#/lib/constants/headings.js";

function textListHtml(key: string, classes: string): string {
  const items = i18next.t(key, { returnObjects: true });

  if (!Array.isArray(items)) {
    return "";
  }

  const listItems = items
    .filter((item): item is string => typeof item === "string")
    .map((item) => `<li>${item}</li>`)
    .join("");

  return `<ul class="${classes}">${listItems}</ul>`;
}

export const declarationHeading = () =>
  GovUKHeading({
    text: t("journeys.declaration.title"),
    level: H1,
  });

export const declarationBody = () =>
  GovUKBody({
    classes: "govuk-body",
    text: `Joe Bloggs ${t("journeys.declaration.clientConfirmation.declarationText")}<br>${textListHtml("journeys.declaration.clientConfirmation.declarationList", "govuk-list govuk-list--bullet govuk-!-margin-bottom-6")}`,
  });

export const declarationWarning = () =>
  GovUKWarningText({
    html: `${t(
      "journeys.declaration.clientConfirmation.warningText",
    )} <br>${textListHtml("journeys.declaration.clientConfirmation.warningList", "govuk-list govuk-list--bullet govuk-!-margin-bottom-6 govuk-!-font-weight-bold")}`,
    iconFallbackText: "Warning",
  });

export const declarationButtonGroup = () =>
  GovUKButtonGroup({
  buttons: [
    GovUKButton({
      text: t("journeys.declaration.confirmButton"),
      buttonType: "submit",
      value: "continue",
    }),
    GovUKButton({
      text: t("common.saveAndReturn"),
      classes: "govuk-button--secondary",
      buttonType: "submit",
      value: "return",
    }),
  ],
});