import {
  Condition,
  Query,
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { OVERSEAS_ADDRESS_FIELDS } from "#/journeys/journey.constants.js";
import {
  clientDetailsCaption,
  continueButton,
  heading,
} from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

import { manualAddressInputs } from "./enterAddressManually.blocks.js";

const TITLE = t("journeys.createApplication.enterAddressManually.title");

/**
 * Builds the step for entering an address manually.
 *
 * @param journeyCode - The code of the journey to which this step belongs.
 * @returns The step definition for entering an address manually.
 */
export function enterAddressManuallyStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [
      clientDetailsCaption(),
      heading(TITLE),
      ...manualAddressInputs(),
      HtmlBlock({
        content: `<p class="govuk-body"><a class="govuk-link" href="enter-overseas-address">${t("journeys.createApplication.enterAddressManually.nonUkAddress")}</a></p>`,
      }),
      continueButton(),
    ],
    onSubmission: [saveUkAddress(journeyCode)],
    path: "/enter-address-manually",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: TITLE,
  });
}

/**
 * Builds the submit hook for saving the UK address.
 *
 * @param journeyCode - The code of the journey to which this submit hook belongs.
 * @returns The submit hook for saving the UK address.
 */
function saveUkAddress(journeyCode: string): SubmitHook {
  return submit({
    onValid: {
      effects: [
        CreateApplicationEffects.clearFieldAnswers(
          journeyCode,
          Object.values(OVERSEAS_ADDRESS_FIELDS),
        ),
        CreateApplicationEffects.saveDraftAnswers(journeyCode),
      ],
      next: [redirectToCheckAnswers],
    },
    validate: true,
  });
}

const redirectToCheckAnswers = redirect({ goto: "check-answers" });
