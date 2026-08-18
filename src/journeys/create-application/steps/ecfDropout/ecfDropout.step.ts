import {
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  ecfDroupoutBody,
  submitFormsBody,
} from "#/journeys/create-application/steps/ecfDropout/ecfDropout.blocks.js";
import {
  ecfDropoutHeading,
  ecfDropoutTitle,
  ecfPath,
  returnToCaseList,
} from "#/journeys/create-application/steps/ecfDropout/ecfDropout.formatters.js";
import { backLink, button, heading } from "#/journeys/shared.blocks.js";

export const ineligibleStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink(ecfPath),
      heading(ecfDropoutHeading),
      ecfDroupoutBody(),
      submitFormsBody(),
      button(returnToCaseList),
    ],
    onSubmission: [onSubmission(journeyCode)],
    path: "/ecf-dropout",
    title: ecfDropoutTitle,
  });

const onSubmission = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [CreateApplicationEffects.clearAllDraftAnswers(journeyCode)],
      next: [redirect({ goto: "/" })],
    },
    validate: true,
  });
