import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { JourneyEffects } from "#/journeys/effects.js";
import { t } from "#/lib/i18n.js";
import { backLink, caption, buttonGroup } from "#/journeys/declaration/common.blocks.js";
import { declarationBody, declarationHeading, declarationWarning } from "#/journeys/declaration/steps/confirmation/client-confirmation.blocks.js";

export const clientConfirmationStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink("/cases/new/task-list"),
      caption,
      declarationHeading(),
      declarationBody(),
      declarationWarning(),
      buttonGroup,
    ],
    onSubmission: [
      submit({
        onValid: {
          effects: [JourneyEffects.SaveDraftAnswers(journeyCode)],
          next: [
            redirect({ goto: "client-declaration-application-summary" }),
          ],
        },
        validate: true,
      }),
    ],
    path: "/client-declaration",
    reachability: { entryWhen: true },
    title: t("journeys.declaration.clientConfirmation.title"),
  });
