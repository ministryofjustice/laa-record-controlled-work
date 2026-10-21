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
import { fixedT } from "#/lib/i18n.js";

const questionT = fixedT("journeys.createApplication.laspoEvidenceScope");

const TITLE = questionT("title");
const GUIDANCE = questionT("guidance");
const REQUIRED_VALIDATION = questionT("validation.required");

/**
 * Creates the guidance text for the Private Family Case Scope question step.
 *
 * @returns A GovUK body component with the guidance text and list.
 */
export function guidance(): GovUKBody {
  return GovUKBody({
    text: GUIDANCE,
  });
}

/**
 * Creates the heading for the Private Family Case Scope question step.
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
 * Creates the Private Family Case Scope question and its yes/no options.
 *
 * @returns A GovUK radio input for the Private Family Case Scope question.
 */
export function scopeQuestion(): GovUKRadioInput {
  return GovUKRadioInput({
    code: AnswerKey.laspoEvidenceScope,
    items: [
      {
        text: questionT("radioButton.domesticAbuse"),
        value: "domesticAbuse",
      },
      {
        text: questionT("radioButton.childAbuse"),
        value: "childAbuse",
      },
      {
        text: questionT("radioButton.under18"),
        value: "under18",
      },
      {
        text: questionT("radioButton.parentOrGuardian"),
        value: "parentOrGuardian",
      },
      {
        divider: questionT("radioButton.or"),
      },
      {
        text: questionT("radioButton.none"),
        value: "none",
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
