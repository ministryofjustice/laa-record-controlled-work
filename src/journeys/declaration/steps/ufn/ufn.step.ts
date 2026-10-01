import {
  Condition,
  Format,
  Params,
  Post,
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { declarationEffects } from "#/journeys/declaration/declaration.effects.js";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

import { caption } from "../../declaration.blocks.js";
import { continueReturnButtons, ufnInput } from "./ufn.blocks.js";
import { hasCheckAnswersInQuery } from "#/journeys/shared.hook.js";

export const ufnStep = (): ReturnType<typeof step> => {
  return step({
    blocks: [caption, ufnInput(), continueReturnButtons()],
    code: "declaration-ufn",
    onSubmission: [saveAndContinueRedirect(), returnToTaskListRedirect()],
    path: "/ufn",
    reachability: {
      entryWhen: hasCheckAnswersInQuery,
    },
    title: t("journeys.declaration.ufn.title"),
  });
};

const saveAndContinueRedirect = (): SubmitHook => {
  return submit({
    onValid: {
      effects: [declarationEffects.saveDraftAnswers("declaration")],
      next: [
        redirect({
          goto: "check-answers",
        }),
      ],
    },
    validate: true,
    when: Post("action").match(Condition.Equals("continue")),
  });
};

const returnToTaskListRedirect = (): SubmitHook => {
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
