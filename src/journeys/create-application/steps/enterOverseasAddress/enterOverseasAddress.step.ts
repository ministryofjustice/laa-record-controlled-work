import {
  Answer,
  Condition,
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import {
  addressLine1Input,
  addressLine2Input,
  addressLine3Input,
  addressLine4Input,
  countryAutocomplete,
  overseasAddressHeading,
  ukAddressLink,
} from "#/journeys/create-application/steps/enterOverseasAddress/enterOverseasAddress.blocks.js";
import { UK_ADDRESS_FIELDS } from "#/journeys/journey.constants.js";
import {
  clientDetailsCaption,
  continueButton,
  heading,
} from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.enterOverseasAddress.title");

/**
 * Creates the overseas address step.
 *
 * @param journeyCode The code for the active journey.
 * @returns A Forge step definition for the overseas address page.
 */
export function enterOverseasAddressStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      heading(TITLE),
      countryAutocomplete(),
      overseasAddressHeading(),
      addressLine1Input(),
      addressLine2Input(),
      addressLine3Input(),
      addressLine4Input(),
      ukAddressLink(),
      continueButton(),
    ],
    onSubmission: [saveOverseasAddress(journeyCode)],
    path: "/enter-overseas-address",
    reachability: {
      entryWhen: Answer(AnswerKey.haveAHomeAddress).match(
        Condition.Equals("yes"),
      ),
    },
    title: TITLE,
  });
}

const saveOverseasAddress = (journeyCode: string): SubmitHook =>
  submit({
    onValid: {
      effects: [
        CreateApplicationEffects.clearFieldAnswers(
          journeyCode,
          Object.values(UK_ADDRESS_FIELDS),
        ),
        CreateApplicationEffects.saveDraftAnswers(journeyCode),
      ],
      next: [redirectToCheckAnswers],
    },
    validate: true,
  });

const redirectToCheckAnswers = redirect({ goto: "check-answers" });
