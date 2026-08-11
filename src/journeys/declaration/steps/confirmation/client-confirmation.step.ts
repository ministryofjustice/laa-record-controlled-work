import {
  Condition,
  Post,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { t } from "#/lib/i18n.js";
import { backLink, caption } from "#/journeys/declaration/common.blocks.js";
import {
  declarationBody,
  declarationButtonGroup,
  declarationHeading,
  declarationWarning,
} from "#/journeys/declaration/steps/confirmation/client-confirmation.blocks.js";

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
      declarationButtonGroup(),
    ],
    onSubmission: [
      submit({
        when: Post("action").match(Condition.Equals("continue")),
        onValid: {
          next: [
            redirect({
              goto: "client-declaration-application-summary",
            }),
          ],
        },
      }),
      submit({
        when: Post("action").match(Condition.Equals("return")),
        onValid: {
          next: [
            redirect({
              goto: "/cases/new/task-list",
            }),
          ],
        },
      }),
    ],
    path: "/client-declaration",
    reachability: { entryWhen: true },
    title: t("journeys.declaration.clientConfirmation.title"),
  });
