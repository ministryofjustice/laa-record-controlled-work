import {
  Condition,
  Query,
  redirect,
  step,
  type StepDefinition,
  submit,
  type SubmitHook,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { OVERSEAS_ADDRESS_FIELDS } from "#/journeys/journey.constants.js";
import { clientDetailsCaption, heading } from "#/journeys/shared.blocks.js";
import { t } from "#/lib/i18n.js";

const TITLE = t("journeys.createApplication.enterAddressManually.title");

/**
 *
 * @param journeyCode
 */
export function enterAddressManuallyStep(journeyCode: string): StepDefinition {
  return step({
    blocks: [clientDetailsCaption(), heading(TITLE)],
    onSubmission: [saveUkAddress(journeyCode)],
    path: "/enter-address-manually",
    reachability: {
      entryWhen: Query("returnTo").match(Condition.Equals("check-answers")),
    },
    title: TITLE,
  });
}

/**
 *
 * @param journeyCode
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
