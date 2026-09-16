import {
  access,
  Data,
  Format,
  Params,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { editClientDetailsEffects } from "#/journeys/edit-client-details/editClientDetails.effects.js";

import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { submitButton } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";
import { heading, summaryList } from "#/journeys/edit-client-details/steps/check-answers/check-answers.blocks.js";

export const checkAnswersStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [heading, summaryList, submitButton],
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
    title: t("journeys.createApplication.checkAnswers.title"),
    reachability: { entryWhen: true },
  });
