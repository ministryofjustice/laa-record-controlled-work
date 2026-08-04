import {
  Condition,
  Query,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  backLink,
  caption,
  continueButton,
  heading,
  requiredTextInput,
} from "#/journeys/common.blocks.js";
import { dateInput } from "#/journeys/create-application/steps/client-details/client-details.blocks.js";
import { JourneyEffects } from "#/journeys/effects.js";
import { ANSWER_CODES } from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

const captionTitle = t("journeys.createApplication.caption");
const title = t("journeys.createApplication.clientDetails.title");
const firstNameLabel = t(
  "journeys.createApplication.clientDetails.firstName.label",
);
const firstNameRequired = t(
  "journeys.createApplication.clientDetails.firstName.validation.required",
);
const lastNameLabel = t(
  "journeys.createApplication.clientDetails.lastName.label",
);
const lastNameRequired = t(
  "journeys.createApplication.clientDetails.lastName.validation.required",
);

export const clientDetailsStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink("/cases/new/legal-aid-before"),
      caption(captionTitle),
      heading(title),
      requiredTextInput(
        ANSWER_CODES.firstName,
        firstNameLabel,
        firstNameRequired,
      ),
      requiredTextInput(ANSWER_CODES.lastName, lastNameLabel, lastNameRequired),
      dateInput,
      continueButton,
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
            redirect({ goto: "ni-number" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/client-details",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title,
  });
