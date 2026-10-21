import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { clientDetailsStep } from "#/journeys/create-application/steps/clientDetails/clientDetails.step.js";
import { ecfStep } from "#/journeys/create-application/steps/ecf/ecf.step.js";
import { ineligibleStep } from "#/journeys/create-application/steps/ecfDropout/ecfDropout.step.js";
import { enterAddressManuallyStep } from "#/journeys/create-application/steps/enterAddressManually/enterAddressManually.step.js";
import { enterOverseasAddressStep } from "#/journeys/create-application/steps/enterOverseasAddress/enterOverseasAddress.step.js";
import { familyLawClassificationStep } from "#/journeys/create-application/steps/familyLawClassification/familyLawClassification.step.js";
import { haveAHomeAddressStep } from "#/journeys/create-application/steps/haveAHomeAddress/haveAHomeAddress.step.js";
import { internationalMaintenanceAgreementStep } from "#/journeys/create-application/steps/internationalMaintenanceAgreement/internationalMaintenanceAgreement.step.js";
import { laspoEvidenceScopeStep } from "#/journeys/create-application/steps/laspoEvidenceScope/laspoEvidenceScope.step.js";
import { legalAidBeforeStep } from "#/journeys/create-application/steps/legalAidBefore/legalAidBefore.step.js";
import { legalAidLast6MonthsStep } from "#/journeys/create-application/steps/legalAidLast6Months/legalAidLast6Months.step.js";
import { letterFromLocalAuthorityStep } from "#/journeys/create-application/steps/letterFromLocalAuthority/letterFromLocalAuthority.step.js";
import { needsProtectiveInjunctionStep } from "#/journeys/create-application/steps/needsProtectiveInjunction/needsProtectiveInjunction.step.js";
import { niNumberStep } from "#/journeys/create-application/steps/niNumber/niNumber.step.js";
import { editClientDetailsEffects } from "#/journeys/edit-client-details/editClientDetails.effects.js";
import { checkAnswersStep } from "#/journeys/edit-client-details/steps/check-answers/check-answers.step.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";
import { familyPrivateNotInScopeStep } from "#/journeys/create-application/steps/familyPrivateNotInScope/familyPrivateNotInScope.step.js";

const editJourneyCode = JourneyCode.EDIT_CLIENT_DETAILS;

// TODO: direct entry disables Forge's answer clearing for
// unreachable branches. Figure out if this is the right way
// to enable editing.
// TODO: this map needs refactoring so that steps have a
// reachability override.
const stepsDirectlyEnterableWhileEditing = [
  ecfStep(editJourneyCode),
  familyLawClassificationStep(editJourneyCode),
  internationalMaintenanceAgreementStep(editJourneyCode),
  needsProtectiveInjunctionStep(editJourneyCode),
  laspoEvidenceScopeStep(editJourneyCode),
  letterFromLocalAuthorityStep(editJourneyCode),
  legalAidBeforeStep(editJourneyCode),
  legalAidLast6MonthsStep(editJourneyCode),
  clientDetailsStep(editJourneyCode),
  niNumberStep(editJourneyCode),
  haveAHomeAddressStep(editJourneyCode),
].map((stepDefinition) => ({
  ...stepDefinition,
  reachability: { ...stepDefinition.reachability, entryWhen: true },
}));

export const editClientDetailsJourney = journey({
  code: editJourneyCode,
  onAccess: [
    access({
      effects: [
        editClientDetailsEffects.loadApplicationAsAnswers(editJourneyCode),
        editClientDetailsEffects.loadDraftAnswers(editJourneyCode),
      ],
    }),
  ],
  path: "/task-list/details",
  reachability: { disableReachabilityChecks: false },
  steps: [
    ...stepsDirectlyEnterableWhileEditing,
    ineligibleStep(editJourneyCode),
    familyPrivateNotInScopeStep(editJourneyCode),
    enterAddressManuallyStep(editJourneyCode),
    enterOverseasAddressStep(editJourneyCode),
    checkAnswersStep(editJourneyCode),
  ],
  title: "Edit client details",
  view: { template: "partials/form-step" },
});
