import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { body } from "#/journeys/create-application/steps/declaration/declaration.blocks.js";
import {
  agreeAndContinue,
  declaration,
} from "#/journeys/create-application/steps/declaration/declaration.formatters.js";
import { backLink, button, heading } from "#/journeys/shared.blocks.js";
import { StepCode } from "#/journeys/StepCode.enum.js";

export const declarationStep = (): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink("/"),
      heading(declaration),
      body(),
      button(agreeAndContinue),
    ],
    onSubmission: [onSubmission],
    path: "/provider-declaration",
    reachability: { entryWhen: true },
    title: declaration,
  });

const onSubmission = submit({
  onAlways: {
    next: [redirect({ goto: StepCode.ECF })],
  },
  validate: false,
});
