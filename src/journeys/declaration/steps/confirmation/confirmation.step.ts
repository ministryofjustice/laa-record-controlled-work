import {
  Condition,
  Format,
  Params,
  Post,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import {
  backLink,
  caption,
} from "#/journeys/declaration/declaration.blocks.js";
import {
  declarationBody,
  declarationButtonGroup,
  declarationHeading,
  declarationWarning,
} from "#/journeys/declaration/steps/confirmation/confirmation.blocks.js";
import { t } from "#/lib/i18n.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";

export const confirmStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink(Format("/cases/%1/task-list/", Params(PARAMS_KEYS.applicationID))),
      caption,
      declarationHeading(),
      declarationBody(),
      declarationWarning(),
      declarationButtonGroup(),
    ],
    onSubmission: [
      submit({
        onValid: {
          next: [
            redirect({
              goto: "sign",
            }),
          ],
        },
        when: Post("action").match(Condition.Equals("continue")),
      }),
      submit({
        onValid: {
          next: [
            redirect({
              goto: Format("/cases/%1/task-list/", Params(PARAMS_KEYS.applicationID)),
            }),
          ],
        },
        when: Post("action").match(Condition.Equals("return")),
      }),
    ],
    path: "/confirm",
    reachability: { entryWhen: true },
    title: t("journeys.declaration.confirm.title"),
  });

