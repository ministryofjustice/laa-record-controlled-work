import {
  access,
  Format,
  Params,
  redirect,
  step,
  submit,
  tieBreaker,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  summaryList,
} from "#/journeys/create-application/steps/checkAnswers/checkAnswers.blocks.js";
import { editClientDetailsEffects } from "#/journeys/edit-client-details/editClientDetails.effects.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { heading, submitButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const CHECK_ANSWERS = t("journeys.createApplication.checkAnswers.title");

const tieBreakerPriority = 100;

export const checkAnswersStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [heading(CHECK_ANSWERS), summaryList(), submitButton()],
    code: "check-answers",
    onAccess: [
      access({
        effects: [editClientDetailsEffects.loadDraftAnswers(journeyCode)],
      }),
    ],
    onSubmission: [
      submit({
        onAlways: {
          next: [
            redirect({
              goto: Format(
                "/cases/%1/task-list",
                Params(PARAMS_KEYS.applicationID),
              ),
            }),
          ],
        },
        validate: false,
      }),
    ],
    path: "/check-answers",
    reachability: {
      entryWhen: true,
      tieBreakers: [tieBreaker({ priority: tieBreakerPriority })],
    },
    title: CHECK_ANSWERS,
  });
