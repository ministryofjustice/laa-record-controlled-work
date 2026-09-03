import {
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
    onSubmission: [onSubmission(journeyCode)],
    path: "/legal-aid-last-6-months",
    reachability: {
      entryWhen: hasCheckAnswersInQuery,
    },
    title: TITLE,
  });

/**
 * Handles form submission for the legal aid in last 6 months question step.
 * Saves draft answers and routes based on the answer:
 * - redirects to client details step
 *
 * @param {string} journeyCode - The journey code for saving draft answers
 * @returns {SubmitHook} A submit hook with validation and conditional routing logic
 */
function onSubmission(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToCheckAnswers,
        redirect({ goto: StepCode.CLIENT_DETAILS }),
      ],
    },
    validate: true,
  });
}
