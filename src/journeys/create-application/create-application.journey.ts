import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { declarationStep } from "#/journeys/create-application/steps/1-declaration.step.js";
import { legalAidLast6MonthsStep } from "#/journeys/create-application/steps/4-legal-aid-last-6-months.step.js";
import { clientDetailsStep } from "#/journeys/create-application/steps/5-client-details.step.js";
import { haveAHomeAddressStep } from "#/journeys/create-application/steps/7-have-a-home-address.step.js";
import { enterAddressManuallyStep } from "#/journeys/create-application/steps/8-enter-address-manually.step.js";
import { enterOverseasAddressStep } from "#/journeys/create-application/steps/9-enter-overseas-address.step.js";
import { JourneyEffects } from "#/journeys/effects.js";

import { ineligibleStep } from "./steps/2-ecf-dropout.step.js";
import { ecfStep } from "./steps/2-ecf.step.js";
import { legalAidBeforeStep } from "./steps/3-legal-aid-before.step.js";
import { niNumberStep } from "./steps/6-ni-number.step.js";
import { checkAnswersStep } from "./steps/99-check-answers.step.js";

const journeyCode = "createApplication";

export const createApplicationJourney = journey({
  code: "createApplication",
  onAccess: [
    access({
      effects: [JourneyEffects.LoadDraftAnswers(journeyCode)],
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
    checkAnswersStep(),
  ],
  title: "Record new case",
  view: { template: "partials/form-step" },
});
