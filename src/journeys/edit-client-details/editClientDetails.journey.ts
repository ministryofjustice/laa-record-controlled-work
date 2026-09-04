import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { checkAnswersStep } from "#/journeys/edit-client-details/steps/check-answers/check-answers.step.js";
import { clientDetailsStep } from "#/journeys/create-application/steps/client-details.step.js";
import { declarationStep } from "#/journeys/create-application/steps/declaration/declaration.step.js";
import { ecfStep } from "#/journeys/create-application/steps/ecf/ecf.step.js";
import { ineligibleStep } from "#/journeys/create-application/steps/ecfDropout/ecfDropout.step.js";
import { enterAddressManuallyStep } from "#/journeys/create-application/steps/enter-address-manually.step.js";
import { enterOverseasAddressStep } from "#/journeys/create-application/steps/enter-overseas-address.step.js";
import { haveAHomeAddressStep } from "#/journeys/create-application/steps/have-a-home-address.step.js";
import { legalAidBeforeStep } from "#/journeys/create-application/steps/legalAidBefore/legalAidBefore.step.js";
import { legalAidLast6MonthsStep } from "#/journeys/create-application/steps/legalAidLast6Months/legal-aid-last-6-months.step.js";
import { niNumberStep } from "#/journeys/create-application/steps/ni-number.step.js";
import { editClientDetailsEffects } from "#/journeys/edit-client-details/editClientDetails.effects.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";
import { editApplicationEffects } from "#/journeys/edit-application/editApplication.effects.js";

const loadDraftAnswers = access({
  effects: [
    editApplicationEffects.loadApplication(),
    editClientDetailsEffects.loadApplicationAsAnswers(
      JourneyCode.EDIT_CLIENT_DETAILS,
    ),
  ],
});

export const editClientDetailsJourney = journey({
  code: JourneyCode.EDIT_CLIENT_DETAILS,
  onAccess: [loadDraftAnswers],
  path: "/cases/:applicationID/edit-client-details",
  reachability: { disableReachabilityChecks: false },
  steps: [
    declarationStep(),
    ecfStep(JourneyCode.EDIT_CLIENT_DETAILS),
    ineligibleStep(JourneyCode.EDIT_CLIENT_DETAILS),
    legalAidBeforeStep(JourneyCode.EDIT_CLIENT_DETAILS),
    legalAidLast6MonthsStep(JourneyCode.EDIT_CLIENT_DETAILS),
    clientDetailsStep(JourneyCode.EDIT_CLIENT_DETAILS),
    niNumberStep(JourneyCode.EDIT_CLIENT_DETAILS),
    haveAHomeAddressStep(JourneyCode.EDIT_CLIENT_DETAILS),
    enterAddressManuallyStep(JourneyCode.EDIT_CLIENT_DETAILS),
    enterOverseasAddressStep(JourneyCode.EDIT_CLIENT_DETAILS),
    checkAnswersStep(JourneyCode.EDIT_CLIENT_DETAILS),
  ],
  title: "Edit client details",
  view: { template: "partials/form-step" },
});
