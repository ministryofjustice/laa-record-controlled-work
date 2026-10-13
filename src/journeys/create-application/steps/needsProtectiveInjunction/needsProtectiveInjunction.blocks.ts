import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKHeading,
  GovUKRadioInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { H1 } from "#/lib/constants/headings.js";
import { i18next, t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.protectThemself.title");
const GUIDANCE = t("journeys.createApplication.protectThemself.guidance");
const REQUIRED_VALIDATION = t(
  "journeys.createApplication.protectThemself.validation.required",
);

/**
 * Creates the guidance text for the Needs Protective Injunction question step.
 *
 * @returns A GovUK body component with the guidance text and list.
 */
export function guidance(): GovUKBody {
  return GovUKBody({
    text: `${GUIDANCE}<br>${textListHtml(
      "journeys.createApplication.protectThemself.guidanceList",
      "govuk-list govuk-list--bullet",
    )}`,
  });
}

/**
 * Creates the heading for the Needs Protective Injunction question step.
 *
 * @returns A GovUK heading component with the step title.
 */
export function heading(): GovUKHeading {
  return GovUKHeading({
    level: H1,
    text: TITLE,
  });
}

/**
 * Creates the Needs Protective Injunction question and its yes/no options.
 *
 * @returns A GovUK radio input for the Needs Protective Injunction question.
 */
export function needsProtectiveInjunctionQuestion(): GovUKRadioInput {
  return GovUKRadioInput({
    code: AnswerKey.needsProtectiveInjunction,
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
        message: REQUIRED_VALIDATION,
      }),
    ],
  });
}

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
