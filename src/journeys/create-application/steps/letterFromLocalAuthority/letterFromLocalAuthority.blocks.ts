import type { BlockDefinition } from "@ministryofjustice/hmpps-forge/core/components";

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
import { t, tt } from "#/lib/i18n.js";

/**
 * Create the body for the "letter from the authority" step.
 *
 * @returns An array of GovUKBody.
 */
export function body(): BlockDefinition[] {
  return tt("journeys.createApplication.letterFromLocalAuthority.body").map(
    (text) => GovUKBody({ text }),
  );
}

/**
 * Creates the heading for the "letter from local authority" step.
 *
 * @returns A GovUK heading.
 */
export function heading(): BlockDefinition {
  const title = t("journeys.createApplication.letterFromLocalAuthority.title");

  return GovUKHeading({
    level: H1,
    text: title,
  });
}

/**
 * Creates the question for the "letter from local authority" step.
 *
 * @returns A GovUK radio input.
 */
export function question(): BlockDefinition {
  const errorMessage = t(
    "journeys.createApplication.letterFromLocalAuthority.validation.required",
  );

  return GovUKRadioInput({
    code: AnswerKey.letterFromLocalAuthority,
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
        message: errorMessage,
      }),
    ],
  });
}
