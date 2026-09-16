import {
  Answer,
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  type GovUKRadioInput,
  GovUKTextInput,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { yesOrNoRadioInput } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.niNumber.title");
const LABEL = t("journeys.createApplication.niNumber.label");
const REQUIRED_VALIDATION = t(
  "journeys.createApplication.niNumber.validation.required",
);
const INVALID_VALIDATION = t(
  "journeys.createApplication.niNumber.validation.invalid",
);
const HAS_NI_NUMBER_VALIDATION = t(
  "journeys.createApplication.niNumber.validation.hasNIRequired",
);
const NI_NUMBER_REGEX =
  "^(?!BG|GB|KN|NK|NT|TN|ZZ)[^DFIQUV][^DFIQUVo][0-9]{6}[ABCD]$";

/**
 * Creates the National Insurance number input shown when the client has one.
 *
 * @returns A GovUK text input for the National Insurance number.
 */
export function niNumberInput(): GovUKTextInput {
  return GovUKTextInput({
    classes: "govuk-input--width-10",
    code: AnswerKey.niNumber,
    dependentWhen: Answer(AnswerKey.hasNINumber).match(Condition.Equals("yes")),
    label: LABEL,
    validWhen: [
      validation({
        condition: Self().match(Condition.IsRequired()),
        message: REQUIRED_VALIDATION,
      }),
      validation({
        condition: Self().match(Condition.String.MatchesRegex(NI_NUMBER_REGEX)),
        message: INVALID_VALIDATION,
      }),
    ],
  });
}

/**
 * Creates the National Insurance number question and its yes/no options.
 *
 * @returns A GovUK radio input for the National Insurance number question.
 */
export function niNumberQuestion(): GovUKRadioInput {
  return yesOrNoRadioInput(
    AnswerKey.hasNINumber,
    TITLE,
    HAS_NI_NUMBER_VALIDATION,
    { yesBlock: niNumberInput() },
  );
}
