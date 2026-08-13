import {
  Data,
  Format,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { submitButton } from "#/journeys/evidence/common.blocks.js";
import { EvidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import {
  heading,
  summaryList,
} from "#/journeys/evidence/steps/check-answers/check-answers.blocks.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

export const checkAnswersStep = (): ReturnType<typeof step> =>
  step({
    blocks: [heading, summaryList, submitButton],
    code: "check-answers",
    onSubmission: [
      submit({
        onAlways: {
          effects: [EvidenceEffects.updateEvidence("evidence")],
          next: [
            redirect({
              goto: Format(
                "/cases/%1/task-list",
                Data(CONTEXT_DATA_KEYS.applicationID),
              ),
            }),
          ],
        },
        validate: false,
      }),
    ],
    path: "check-answers",
    title: t("journeys.createApplication.checkAnswers.title"),
  });
