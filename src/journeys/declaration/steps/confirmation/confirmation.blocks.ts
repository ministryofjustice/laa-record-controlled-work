import type { BlockDefinition } from "@ministryofjustice/hmpps-forge/core/components";

import {
  GovUKBody,
  GovUKButton,
  GovUKButtonGroup,
  GovUKHeading,
  GovUKWarningText,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1 } from "#/lib/constants/headings.js";
import { i18next, t } from "#/lib/i18n.js";

/**
 * Generates an HTML unordered list from a translation key that returns an array of strings.
 * @param key - The key in the translation file
 * @param classes - The classes to apply to the unordered list
 * @returns An HTML string representing the unordered list
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

export const confirmHeading = (): BlockDefinition =>
  GovUKHeading({
    level: H1,
    text: t("journeys.declaration.confirm.title"),
  });

export const confirmBody = (): BlockDefinition =>
  GovUKBody({
    classes: "govuk-body",
    text: `Joe Bloggs ${t("journeys.declaration.confirm.declarationText")}<br>${textListHtml("journeys.declaration.confirm.declarationList", "govuk-list govuk-list--bullet govuk-!-margin-bottom-6")}`,
  });

export const confirmWarning = (): BlockDefinition =>
  GovUKWarningText({
    html: `${t(
      "journeys.declaration.confirm.warningText",
    )} <br>${textListHtml("journeys.declaration.confirm.warningList", "govuk-list govuk-list--bullet govuk-!-margin-bottom-6 govuk-!-font-weight-bold")}`,
    iconFallbackText: "Warning",
  });

export const confirmButtonGroup = (): BlockDefinition =>
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
