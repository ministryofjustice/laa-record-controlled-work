import {
  Condition,
  Format,
  Params,
  Post,
  redirect,
  step,
  submit,
  SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";

import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

import { caption } from "../../declaration.blocks.js";
import {
  confirmHeading,
  confirmSignedCheckbox,
  confirmSignedDate,
  continueReturnButtons,
  downloadButton,
  heading,
  statement,
} from "./sign.blocks.js";
import { declarationEffects } from "#/journeys/declaration/declaration.effects.js";

export const signStep = (): ReturnType<typeof step> => {
  return step({
    blocks: [
      caption,
      heading(),
      ...statement(),
      downloadButton(),
      confirmHeading(),
      confirmSignedCheckbox(),
      confirmSignedDate(),
      continueReturnButtons(),
    ],
    code: "declaration-sign",
    onSubmission: [saveOnContinue(), returnToTaskListOnReturn()],
    path: "/sign",
    title: t("journeys.declaration.sign.title"),
  });
};

const saveOnContinue = (): SubmitHook => {
  return submit({
    onValid: {
      effects: [declarationEffects.saveDraftAnswers("declaration")],
      next: [redirectToCheckAnswers, redirectToUFN],
    },
    validate: true,
    when: Post("action").match(Condition.Equals("continue")),
  });
};

const returnToTaskListOnReturn = (): SubmitHook => {
  return submit({
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
    when: Post("action").match(Condition.Equals("return")),
  });
};

const redirectToUFN = redirect({
  goto: "ufn",
});
