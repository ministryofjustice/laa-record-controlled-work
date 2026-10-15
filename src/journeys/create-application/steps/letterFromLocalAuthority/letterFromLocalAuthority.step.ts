import {
  Answer,
  Condition,
  redirect,
  type RedirectOutcome,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  body,
  heading,
  question,
} from "#/journeys/create-application/steps/letterFromLocalAuthority/letterFromLocalAuthority.blocks.js";
import { continueButton } from "#/journeys/shared.blocks.js";
import { hasCheckAnswersInQuery } from "#/journeys/shared.hook.js";
import { StepCode } from "#/journeys/StepCode.enum.js";
import { t } from "#/lib/i18n.js";

/**
 * Letter from Local Authority step.
 * @param journeyCode  Journey code.
 * @returns The Letter from Local Authority step definition.
 */
export function letterFromLocalAuthorityStep(
  journeyCode: string,
): StepDefinition {
  const title = t("journeys.createApplication.letterFromLocalAuthority.title");

  return step({
    blocks: [heading(), ...body(), question(), continueButton()],
    code: StepCode.LETTER_FROM_LOCAL_AUTHORITY,
    onSubmission: [
      onSubmitYes(journeyCode),
      onSubmitNo(journeyCode),
      onSubmitInvalid(),
    ],
    path: "care-proceedings",
    title,
  });
}

/**
 * Handle submission of an invalid value.
 * @returns Submit hook.
 */
function onSubmitInvalid(): SubmitHook {
  return submit({
    onInvalid: {},
    validate: true,
  });
}

/**
 * Handle submission of a "no" value.
 * @param journeyCode  The journey code.
 * @returns Submit hook.
 */
function onSubmitNo(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToCheckAnswers(),
        redirectToConfirmMerits(),
      ],
    },
    validate: true,
    when: Answer(AnswerKey.letterFromLocalAuthority).match(
      Condition.Equals("no"),
    ),
  });
}

/**
 * Handle submission of a "yes" value.
 * @param journeyCode  The journey code.
 * @returns Submit hook.
 */
function onSubmitYes(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [
        redirectToCheckAnswers(),
        redirectToParentalResponsibility(),
      ],
    },
    validate: true,
    when: Answer(AnswerKey.letterFromLocalAuthority).match(
      Condition.Equals("yes"),
    ),
  });
}

/**
 * Redirect to Check Answers step if URL indicates we're editing the answer.
 * @returns Redirect hook.
 */
function redirectToCheckAnswers(): RedirectOutcome {
  return redirect({
    goto: "check-answers",
    when: hasCheckAnswersInQuery,
  });
}

/**
 * Redirect to the Confirm Merits step.
 * @returns Redirect hook.
 */
function redirectToConfirmMerits(): RedirectOutcome {
  return redirect({
    goto: "confirm-merits",
    when: Answer(AnswerKey.letterFromLocalAuthority).match(
      Condition.Equals("no"),
    ),
  });
}

/**
 * Redirect to Parental Responsibility step.
 * @returns Redirect hook.
 */
function redirectToParentalResponsibility(): RedirectOutcome {
  return redirect({
    goto: "parental-responsibility",
    when: Answer(AnswerKey.letterFromLocalAuthority).match(
      Condition.Equals("yes"),
    ),
  });
}
