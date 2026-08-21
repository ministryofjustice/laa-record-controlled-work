import type { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { yesOrNoRadioInput } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const QUESTION = t("journeys.createApplication.ecf.title");

const VALIDATION_MESSAGE = t(
  "journeys.createApplication.ecf.validation.required",
);

/**
 * Creates a yes/no radio input for the ECF question.
 *
 * @returns {GovUKRadioInput} A GovUK radio input component with yes/no options for the ECF question
 */
export function ecfQuestion(): GovUKRadioInput {
  return yesOrNoRadioInput(AnswerKey.ecf, QUESTION, VALIDATION_MESSAGE);
}
