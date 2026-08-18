import {
  Answer,
  Condition,
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { AnswerValue } from "#/journeys/AnswerValues.enum.js";
import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  declarationPath,
  ecfCaptionTitle,
  ecfQuestion,
  ecfRequiredValidationMessage,
} from "#/journeys/create-application/steps/ecf/ecf.formatters.js";
import { CreateApplicationPath } from "#/journeys/JourneyPath.enum.js";
import {
  backLink,
  caption,
  continueButton,
  yesOrNoRadioInput,
} from "#/journeys/shared.blocks.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";

export const ecfStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink(declarationPath),
      caption(ecfCaptionTitle),
      yesOrNoRadioInput(
        StepCode.ECF,
        ecfQuestion,
        ecfRequiredValidationMessage,
      ),
      continueButton(),
    ],
    onSubmission: [onSubmission(journeyCode)],
    path: CreateApplicationPath.ECF,
    reachability: { entryWhen: true },
    title: ecfQuestion,
  });

const onSubmission = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToCheckAnswers,
        redirectToECFDropout,
        redirectToLegalAidBefore,
      ],
    },
    validate: true,
  });

const redirectToECFDropout = redirect({
  goto: StepCode.ECF_DROPOUT,
  when: Answer(StepCode.ECF).match(Condition.Equals(AnswerValue.YES)),
});

const redirectToLegalAidBefore = redirect({ goto: StepCode.LEGAL_AID_BEFORE });
