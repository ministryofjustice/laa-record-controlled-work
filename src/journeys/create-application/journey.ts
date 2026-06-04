import { access, journey } from "@ministryofjustice/hmpps-forge/core/authoring";

import { clientDetailsStep } from "#/journeys/create-application/steps/4-client-details.step.js";
import { JourneyEffects } from "#/journeys/effects.js";

import { ineligibleStep } from "./steps/1-ecf-dropout.step.js";
import { ecfStep } from "./steps/1-ecf.step.js";
import { legalAidBeforeStep } from "./steps/2-legal-aid-before.step.js";
import { legalAidBefore6MonthsStep } from "./steps/3-legal-aid-within-6-months.step.js";
import { niNumberStep } from "./steps/5-ni-number.step.js";

const journeyCode = "createApplication";

export const createApplicationJourney = journey({
  code: "createApplication",
  onAccess: [
    access({
      effects: [JourneyEffects.LoadDraftAnswers(journeyCode)],
    }),
  ],
  path: "/create-application",
  reachability: { disableReachabilityChecks: false },
  steps: [
    ecfStep(journeyCode),
    ineligibleStep(journeyCode),
    legalAidBeforeStep(journeyCode),
    legalAidBefore6MonthsStep(journeyCode),
    clientDetailsStep(journeyCode),
    niNumberStep(journeyCode),
  ],
  title: "Record new case",
  view: { template: "partials/form-step" },
});
