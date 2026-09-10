import {
  Answer,
  Condition,
  redirect,
  step,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { legalAidLast6MonthsRadioInput } from "#/journeys/create-application/steps/legalAidLast6Months/legal-aid-last-6-months.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import {
  hasCheckAnswersInQuery,
  redirectToCheckAnswers,
} from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.legalAidLast6Months.title");

export const legalAidLast6MonthsStep = (
  journeyCode: string,
): ReturnType<typeof step> =>
  step({
    blocks: [
      clientDetailsCaption(),
      legalAidLast6MonthsRadioInput(),
      continueButton(),
    ],
    onSubmission: [
      saveNoAndClearPriorLegalAidReasonData(journeyCode),
      saveYes(journeyCode),
      submitInvalid,
    ],
    path: "/legal-aid-last-6-months",
    reachability: {
      entryWhen: hasCheckAnswersInQuery,
    },
    title: TITLE,
  });

const saveNoAndClearPriorLegalAidReasonData = (
  journeyCode: string,
): SubmitHook =>
  submit({
    onValid: {
      effects: [
        CreateApplicationEffects.clearFieldAnswers(journeyCode, [
          "reasonForYes",
        ]),
        CreateApplicationEffects.saveDraftAnswers(journeyCode),
      ],
      next: [redirectToCheckAnswers, redirectToClientDetails],
    },
    validate: true,
    when: Answer("legalAidLast6Months").match(Condition.Equals("no")),
  });

const saveYes = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [redirectToCheckAnswers, redirectToClientDetails],
    },
    validate: true,
    when: Answer("legalAidLast6Months").match(Condition.Equals("yes")),
  });

const submitInvalid = submit({
  onInvalid: {},
  validate: true,
});

const redirectToClientDetails = redirect({ goto: StepCode.CLIENT_DETAILS });
