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
  yesNoRadioInput,
} from "#/journeys/create-application/journey.helper.js";
import { JourneyEffects } from "#/journeys/effects.js";
import { t } from "#/lib/i18n.js";

export const ecfStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      backlink("/"),
      captionTitle(t("journeys.createApplication.caption")),
      yesNoRadioInput(
        "ecf",
        t("journeys.createApplication.ecf.title"),
        t("journeys.createApplication.ecf.validationMessage"),
      ),
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
              goto: "ecf-dropout",
              when: Answer("ecf").match(Condition.Equals("yes")),
            }),
            redirect({ goto: "legal-aid-before" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/ecf",
    reachability: { entryWhen: true },
    title: t("journeys.createApplication.ecf.title"),
  });
