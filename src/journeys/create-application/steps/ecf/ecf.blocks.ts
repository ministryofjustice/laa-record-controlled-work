import type { GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { yesOrNoRadioInput } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const question = t("journeys.createApplication.ecf.title");

const validationMessage = t(
  "journeys.createApplication.ecf.validation.required",
);
export const ecfQuestion = (): GovUKRadioInput =>
  yesOrNoRadioInput(AnswerKey.ECF, question, validationMessage);
