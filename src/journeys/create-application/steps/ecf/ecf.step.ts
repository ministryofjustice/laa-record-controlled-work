import {
  Answer,
  Condition,
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { ecfQuestion } from "#/journeys/create-application/steps/ecf/ecf.blocks.js";
import { JourneyPath } from "#/journeys/JourneyPath.enum.js";
import {
  backLink,
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import { redirectToCheckAnswers } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { t } from "#/lib/i18n.js";

const DECLARATION_PATH = `${JourneyPath.CREATE_APPLICATION}/provider-declaration`;
const TITLE = t("journeys.createApplication.ecf.title");

export const ecfStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      backLink(DECLARATION_PATH),
      clientDetailsCaption(),
      ecfQuestion(),
      continueButton(),
    ],
    code: StepCode.ECF,
    onSubmission: [onSubmission(journeyCode)],
    path: "/ecf",
    reachability: { entryWhen: true },
    title: TITLE,
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
  when: Answer(AnswerKey.ECF).match(Condition.Equals("yes")),
});

const redirectToLegalAidBefore = redirect({ goto: StepCode.LEGAL_AID_BEFORE });
