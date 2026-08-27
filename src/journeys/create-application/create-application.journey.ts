import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { clientDetailsStep } from "#/journeys/create-application/steps/client-details.step.js";
import { declarationStep } from "#/journeys/create-application/steps/declaration/declaration.step.js";
import { enterAddressManuallyStep } from "#/journeys/create-application/steps/enter-address-manually.step.js";
import { enterOverseasAddressStep } from "#/journeys/create-application/steps/enter-overseas-address.step.js";
import { haveAHomeAddressStep } from "#/journeys/create-application/steps/have-a-home-address.step.js";
import { legalAidLast6MonthsStep } from "#/journeys/create-application/steps/legal-aid-last-6-months.step.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";
import { JourneyPath } from "#/journeys/JourneyPath.enum.js";

import { checkAnswersStep } from "./steps/check-answers.step.js";
import { ecfStep } from "./steps/ecf/ecf.step.js";
import { ineligibleStep } from "./steps/ecfDropout/ecfDropout.step.js";
import { legalAidBeforeStep } from "./steps/legal-aid-before.step.js";
import { niNumberStep } from "./steps/ni-number.step.js";

const loadDraftAnswers = access({
  effects: [
    CreateApplicationEffects.loadDraftAnswers(JourneyCode.CREATE_APPLICATION),
  ],
});

export const createApplicationJourney = journey({
  code: JourneyCode.CREATE_APPLICATION,
  onAccess: [loadDraftAnswers],
  path: JourneyPath.CREATE_APPLICATION,
  reachability: { disableReachabilityChecks: false },
  steps: [
    declarationStep(),
    ecfStep(JourneyCode.CREATE_APPLICATION),
    ineligibleStep(JourneyCode.CREATE_APPLICATION),
    legalAidBeforeStep(JourneyCode.CREATE_APPLICATION),
    legalAidLast6MonthsStep(JourneyCode.CREATE_APPLICATION),
    clientDetailsStep(JourneyCode.CREATE_APPLICATION),
    niNumberStep(JourneyCode.CREATE_APPLICATION),
    haveAHomeAddressStep(JourneyCode.CREATE_APPLICATION),
    enterAddressManuallyStep(JourneyCode.CREATE_APPLICATION),
    enterOverseasAddressStep(JourneyCode.CREATE_APPLICATION),
    checkAnswersStep(JourneyCode.CREATE_APPLICATION),
  ],
  title: "Record new case",
  view: { template: "partials/form-step" },
});
