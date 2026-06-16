import {
  Answer,
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  backlink,
  button,
  captionTitle,
} from "#/journeys/create-application/journey.helper.js";
import { legalAidBeforeRadioButtons } from "#/journeys/create-application/steps/2-legal-aid-before/2-legal-aid-before.blocks.js";
import { JourneyEffects } from "#/journeys/effects.js";
import { t } from "#/lib/i18n.js";

export const legalAidBeforeStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backlink("/create-application/ecf"),
      captionTitle(t("journeys.createApplication.caption")),
      legalAidBeforeRadioButtons(),
      button(t("common.continue")),
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
          next: [
            redirect({
              goto: "check-answers",
              when: Query("returnTo").match(Condition.Equals("check-answers")),
            }),
            redirect({
              goto: "legal-aid-last-6-months",
              when: Answer("legalAidBefore").match(
                Condition.Equals("yesSameMatter"),
              ),
            }),
            redirect({ goto: "client-details" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/legal-aid-before",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: t("journeys.createApplication.legalAidBefore.title"),
  });
