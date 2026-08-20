import {
  Condition,
  Format,
  Params,
  Post,
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { t } from "#/lib/i18n.js";

import { backLink, caption } from "../../declaration.blocks.js";
import { declarationEffects } from "../../declaration.effects.js";
import {
  confirmHeading,
  confirmSignedCheckbox,
  confirmSignedDate,
  continueReturnButtons,
  downloadButton,
  heading,
  statement,
} from "./sign.blocks.js";

export const signStep = (): ReturnType<typeof step> => {
  return step({
    blocks: [
      backLink(
        Format(
          "/cases/%1/declaration/confirm",
          Params(PARAMS_KEYS.applicationID),
        ),
      ),
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
    onSubmission: [
      submit({
        onValid: {
          effects: [declarationEffects.submitSignedDeclaration()],
          next: [
            redirect({
              goto: "ufn",
            }),
          ],
        },
        validate: true,
        when: Post("action").match(Condition.Equals("continue")),
      }),
      submit({
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
      }),
    ],
    path: "/sign",
    title: t("journeys.declaration.sign.title"),
  });
};
