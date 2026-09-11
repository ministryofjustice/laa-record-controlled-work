import {
  Answer,
  Condition,
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { haveAHomeAddressQuestion } from "#/journeys/create-application/steps/haveAHomeAddress/haveAHomeAddress.blocks.js";
import {
  OVERSEAS_ADDRESS_FIELDS,
  UK_ADDRESS_FIELDS,
} from "#/journeys/journey.constants.js";
import {
  clientDetailsCaption,
  continueButton,
} from "#/journeys/shared.blocks.js";
import { hasCheckAnswersInQuery } from "#/journeys/shared.hook.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.haveAHomeAddress.title");

/**
 * Creates the home address step.
 *
 * @param journeyCode The code for the active journey.
 * @returns A Forge step definition for the home address page.
 */
export function haveAHomeAddressStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      haveAHomeAddressQuestion(),
      continueButton(),
    ],
    onSubmission: [
      saveNoAndClearAddressAnswers(journeyCode),
      saveYes(journeyCode),
      submitInvalid,
    ],
    path: "/have-a-home-address",
    reachability: {
      entryWhen: hasCheckAnswersInQuery,
    },
    title: TITLE,
  });
}

const saveNoAndClearAddressAnswers = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [
        CreateApplicationEffects.clearFieldAnswers(journeyCode, [
          ...Object.values(UK_ADDRESS_FIELDS),
          ...Object.values(OVERSEAS_ADDRESS_FIELDS),
        ]),
        CreateApplicationEffects.saveDraftAnswers(journeyCode),
      ],
      next: [redirectToCheckAnswers],
    },
    validate: true,
    when: Answer("haveAHomeAddress").match(Condition.Equals("no")),
  });

const saveYes = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [CreateApplicationEffects.saveDraftAnswers(journeyCode)],
      next: [redirectToAddressWithCheckQuery, redirectToAddress],
    },
    validate: true,
    when: Answer("haveAHomeAddress").match(Condition.Equals("yes")),
  });

const submitInvalid = submit({
  onInvalid: {},
  validate: true,
});

const redirectToAddressWithCheckQuery = redirect({
  goto: "enter-address-manually?returnTo=check-answers",
  when: hasCheckAnswersInQuery,
});

const redirectToAddress = redirect({ goto: "enter-address-manually" });

const redirectToCheckAnswers = redirect({ goto: "check-answers" });
