import {
  Condition,
  Post,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { t } from "#/lib/i18n.js";
import { backLink, caption } from "#/journeys/declaration/declaration.blocks.js";
import {
  declarationBody,
  declarationButtonGroup,
  declarationHeading,
  declarationWarning,
} from "#/journeys/declaration/steps/confirmation/confirmation.blocks.js";

export const confirmStep = (
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
              goto: "sign",
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
    path: "/confirm",
    reachability: { entryWhen: true },
    title: t("journeys.declaration.confirm.title"),
  });
