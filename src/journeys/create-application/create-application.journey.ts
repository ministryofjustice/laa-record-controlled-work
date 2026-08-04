import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { CreateApplicationEffects } from "#/journeys/create-application/create-application.effects.js";
import { clientDetailsStep } from "#/journeys/create-application/steps/client-details.step.js";
import { declarationStep } from "#/journeys/create-application/steps/declaration.step.js";
import { enterAddressManuallyStep } from "#/journeys/create-application/steps/enter-address-manually.step.js";
import { enterOverseasAddressStep } from "#/journeys/create-application/steps/enter-overseas-address.step.js";
import { haveAHomeAddressStep } from "#/journeys/create-application/steps/have-a-home-address.step.js";
import { legalAidLast6MonthsStep } from "#/journeys/create-application/steps/legal-aid-last-6-months.step.js";

import { checkAnswersStep } from "./steps/check-answers.step.js";
import { ineligibleStep } from "./steps/ecf-dropout.step.js";
import { ecfStep } from "./steps/ecf.step.js";
import { legalAidBeforeStep } from "./steps/legal-aid-before.step.js";
import { niNumberStep } from "./steps/ni-number.step.js";

const journeyCode = "createApplication";

export const createApplicationJourney = journey({
  code: "createApplication",
  onAccess: [
    access({
      effects: [CreateApplicationEffects.loadDraftAnswers(journeyCode)],
    }),
  ],
  path: "/cases/new",
  reachability: { disableReachabilityChecks: false },
  steps: [
    declarationStep(journeyCode),
    ecfStep(journeyCode),
    ineligibleStep(journeyCode),
    legalAidBeforeStep(journeyCode),
    legalAidLast6MonthsStep(journeyCode),
    clientDetailsStep(journeyCode),
    niNumberStep(journeyCode),
    haveAHomeAddressStep(journeyCode),
    enterAddressManuallyStep(journeyCode),
    enterOverseasAddressStep(journeyCode),
    checkAnswersStep(journeyCode),
  ],
  title: "Record new case",
  view: { template: "partials/form-step" },
});
