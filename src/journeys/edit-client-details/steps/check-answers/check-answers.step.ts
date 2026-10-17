import {
  access,
  Format,
  Params,
  redirect,
  step,
  type StepDefinition,
  submit,
  tieBreaker,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { editSummaryListBlock } from "#/journeys/create-application/steps/checkAnswers/checkAnswers.blocks.js";
import { checkAnswersComplete } from "#/journeys/create-application/steps/checkAnswers/checkAnswers.model.js";
import { editClientDetailsEffects } from "#/journeys/edit-client-details/editClientDetails.effects.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { heading, submitButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const CHECK_ANSWERS = t("journeys.createApplication.checkAnswers.title");

const tieBreakerPriority = 100;

/**
 * Creates the editable check-answers step.
 * @param journeyCode The journey whose draft should be loaded.
 * @returns The check-answers step definition.
 */
export function checkAnswersStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [heading(CHECK_ANSWERS), editSummaryListBlock(), submitButton()],
    code: "check-answers",
    onAccess: [
      access({
        effects: [editClientDetailsEffects.loadDraftAnswers(journeyCode)],
      }),
    ],
    onSubmission: [
      submit({
        onValid: {
          next: [
            redirect({
              goto: Format(
                "/cases/%1/task-list",
                Params(PARAMS_KEYS.applicationID),
              ),
            }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/check-answers",
    reachability: {
      entryWhen: true,
      tieBreakers: [tieBreaker({ priority: tieBreakerPriority })],
    },
    title: CHECK_ANSWERS,
    validWhen: [
      validation({
        condition: checkAnswersComplete(),
        message: t(
          "journeys.createApplication.checkAnswers.validation.incomplete",
        ),
        submissionOnly: true,
      }),
    ],
  });
}
