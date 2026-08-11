import { Data, Format } from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKButton,
  GovUKButtonGroup,
  GovUKHeading,
  GovUKWarningText,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import {
  CLIENT_DETAILS_DATA_KEYS,
  CONTEXT_DATA_KEYS,
} from "#/journeys/journey.constants.js";
import { H1 } from "#/lib/constants/headings.js";
import { i18next, t } from "#/lib/i18n.js";

/**
 *
 * @param key
 * @param classes
 */
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
    level: H1,
    text: t("journeys.declaration.confirm.title"),
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
        buttonType: "submit",
        text: t("journeys.declaration.confirm.confirmButton"),
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
