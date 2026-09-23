import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { clientDetailsStep } from "#/journeys/create-application/steps/clientDetails/clientDetails.step.js";
import { ecfStep } from "#/journeys/create-application/steps/ecf/ecf.step.js";
import { ineligibleStep } from "#/journeys/create-application/steps/ecfDropout/ecfDropout.step.js";
import { enterAddressManuallyStep } from "#/journeys/create-application/steps/enter-address-manually.step.js";
import { enterOverseasAddressStep } from "#/journeys/create-application/steps/enter-overseas-address.step.js";
import { haveAHomeAddressStep } from "#/journeys/create-application/steps/haveAHomeAddress/haveAHomeAddress.step.js";
import { legalAidBeforeStep } from "#/journeys/create-application/steps/legalAidBefore/legalAidBefore.step.js";
import { legalAidLast6MonthsStep } from "#/journeys/create-application/steps/legalAidLast6Months/legalAidLast6Months.step.js";
import { niNumberStep } from "#/journeys/create-application/steps/niNumber/niNumber.step.js";
import { editClientDetailsEffects } from "#/journeys/edit-client-details/editClientDetails.effects.js";
import { checkAnswersStep } from "#/journeys/edit-client-details/steps/check-answers/check-answers.step.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";

const editJourneyCode = JourneyCode.EDIT_CLIENT_DETAILS;

export const editClientDetailsJourney = journey({
  code: editJourneyCode,
  onAccess: [
    access({
      effects: [editClientDetailsEffects.loadDraftAnswers(editJourneyCode)],
    }),
  ],
  path: "/cases/:applicationID/task-list/details",
  reachability: { disableReachabilityChecks: true },
  steps: [
    ecfStep(editJourneyCode),
    ineligibleStep(editJourneyCode),
    legalAidBeforeStep(editJourneyCode),
    legalAidLast6MonthsStep(editJourneyCode),
    clientDetailsStep(editJourneyCode),
    niNumberStep(editJourneyCode),
    haveAHomeAddressStep(editJourneyCode),
    enterAddressManuallyStep(editJourneyCode),
    enterOverseasAddressStep(editJourneyCode),
    checkAnswersStep(editJourneyCode),
  ],
  title: "Edit client details",
  view: { template: "partials/form-step" },
});
