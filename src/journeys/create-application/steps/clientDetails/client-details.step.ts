import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  dateOfBirthInput,
  firstNameInput,
  lastNameInput,
} from "#/journeys/create-application/steps/clientDetails/client-details.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
  heading,
} from "#/journeys/shared.blocks.js";
import {
  hasCheckAnswersInQuery,
  redirectToCheckAnswers,
} from "#/journeys/shared.hook.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.clientDetails.title");

export const clientDetailsStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      clientDetailsCaption(),
      heading(TITLE),
      firstNameInput(),
      lastNameInput(),
      dateOfBirthInput(),
      continueButton(),
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
          next: [redirectToCheckAnswers, redirect({ goto: "ni-number" })],
        },
        validate: true,
      }),
    ],
    path: "/client-details",
    reachability: {
      entryWhen: hasCheckAnswersInQuery,
    },
    title: TITLE,
  });
