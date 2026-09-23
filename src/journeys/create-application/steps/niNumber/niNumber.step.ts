import {
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { niNumberQuestion } from "#/journeys/create-application/steps/niNumber/niNumber.blocks.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import {
  hasCheckAnswersInQuery,
  redirectToCheckAnswers,
} from "#/journeys/shared.hook.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.niNumber.title");

/**
 *
 * @param journeyCode
 */
/**
 * Creates the National Insurance number step.
 *
 * @param journeyCode The code for the active journey.
 * @returns A Forge step definition for the National Insurance number page.
 */
export function niNumberStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [clientDetailsCaption(), niNumberQuestion(), continueButton()],
    onSubmission: [saveNiNumber(journeyCode)],
    path: "/ni-number",
    reachability: {
      entryWhen: hasCheckAnswersInQuery,
    },
    title: TITLE,
  });
}

const saveNiNumber = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [redirectToCheckAnswers, redirectToHomeAddress],
    },
    validate: true,
  });

const redirectToHomeAddress = redirect({ goto: "have-a-home-address" });
