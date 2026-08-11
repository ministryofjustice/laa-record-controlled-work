import {
  GovUKBody,
  GovUKHeading,
  GovUKWarningText,
  GovUKButton,
  GovUKButtonGroup,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { i18next, t } from "#/lib/i18n.js";
import { H1 } from "#/lib/constants/headings.js";
import { Data, Format } from "@ministryofjustice/hmpps-forge/core/authoring";
import { CONTEXT_DATA_KEYS, CLIENT_DETAILS_DATA_KEYS } from "#/journeys/journey.constants.js";

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

// const clientName = Format(
//   "%1 %2",
//   Data(CONTEXT_DATA_KEYS.application).path(CLIENT_DETAILS_DATA_KEYS.firstName),
//   Data(CONTEXT_DATA_KEYS.application).path(CLIENT_DETAILS_DATA_KEYS.lastName),
// );

export const declarationHeading = () =>
  GovUKHeading({
    text: t("journeys.declaration.confirm.title"),
    level: H1,
  });

export const declarationBody = () =>
  GovUKBody({
    classes: "govuk-body",
    text: `Joe Bloggs ${t("journeys.declaration.confirm.declarationText")}<br>${textListHtml("journeys.declaration.confirm.declarationList", "govuk-list govuk-list--bullet govuk-!-margin-bottom-6")}`,
  });

export const declarationWarning = () =>
  GovUKWarningText({
    html: `${t(
      "journeys.declaration.confirm.warningText",
    )} <br>${textListHtml("journeys.declaration.confirm.warningList", "govuk-list govuk-list--bullet govuk-!-margin-bottom-6 govuk-!-font-weight-bold")}`,
    iconFallbackText: "Warning",
  });

export const declarationButtonGroup = () =>
  GovUKButtonGroup({
  buttons: [
    GovUKButton({
      text: t("journeys.declaration.confirm.confirmButton"),
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