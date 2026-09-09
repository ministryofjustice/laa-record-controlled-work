import {
  and,
  Answer,
  Condition,
  not,
  redirect,
  type RedirectOutcome,
  step,
  type StepDefinition,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { legalAidBeforeRadioInput } from "#/journeys/create-application/steps/legalAidBefore/legalAidBefore.blocks.js";
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

const TITLE = t("journeys.createApplication.legalAidBefore.title");

/**
 * Defines the legal aid history step for the create application journey.
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {StepDefinition} A step definition for the legal aid history question page
 */
export function legalAidBeforeStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      legalAidBeforeRadioInput(),
      continueButton(),
    ],
    code: StepCode.LEGAL_AID_BEFORE,
    onSubmission: [
      // clear sub-journey answers if answer not "yesSameMatter"
      submit({
        onValid: {
          effects: [
            CreateApplicationEffects.clearFieldAnswers(journeyCode, [
              "legalAidLast6Months",
              "reasonForYes",
            ]),
            CreateApplicationEffects.saveDraftAnswers(journeyCode),
          ],
          next: next(),
        },
        validate: true,
        when: not(
          Answer(AnswerKey.legalAidBefore).match(
            Condition.Equals("yesSameMatter"),
          ),
        ),
      }),

      submit({
        onValid: {
          effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
          next: next(),
        },
        validate: true,
      }),
    ],
    path: "/legal-aid-before",
    reachability: {
      entryWhen: hasCheckAnswersInQuery,
    },
    title: TITLE,
  });
}

/**
 * Builds the routes used after a valid legal aid history submission.
 *
 * @returns {RedirectOutcome[]} The submission routes
 */
function next(): RedirectOutcome[] {
  return [
    redirect({
      goto: `${StepCode.LEGAL_AID_LAST_6_MONTHS}?returnTo=check-answers`,
      when: and(
        hasCheckAnswersInQuery,
        Answer(AnswerKey.legalAidBefore).match(
          Condition.Equals("yesSameMatter"),
        ),
      ),
    }),

    redirectToCheckAnswers,

    redirect({
      goto: StepCode.LEGAL_AID_LAST_6_MONTHS,
      when: Answer(AnswerKey.legalAidBefore).match(
        Condition.Equals("yesSameMatter"),
      ),
    }),

    redirect({ goto: StepCode.CLIENT_DETAILS }),
  ];
}
