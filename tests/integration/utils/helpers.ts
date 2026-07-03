import {
  access,
  journey,
  type StepDefinition,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  createTestPackage,
  type ForgeTestClient,
  ForgeTestHarness,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { nunjucksFunctions } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { mojComponents } from "@ministryofjustice/hmpps-forge/moj-components";

import { autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import {
  JourneyEffects,
  JourneyEffectsImplementations,
} from "#/journeys/effects.js";
import {
  CaseListEffects,
  CaseListEffectsImplementations,
} from "#/journeys/your-cases/effects.js";
import { yourCasesStep } from "#/journeys/your-cases/steps/your-cases/your-cases.step.js";

/**
 * Creates a test client for a single-step journey under /create-application.
 * @param {...any} steps - Step definitions to include in the test journey.
 * @returns {ForgeTestClient} A configured test client.
 */
export function createForgeTestClient(
  ...steps: StepDefinition[]
): ForgeTestClient {
  const testJourney = journey({
    code: "testJourney",
    path: "/create-application",
    onAccess: [
      access({
        effects: [JourneyEffects.LoadDraftAnswers("testJourney")],
      }),
    ],
    reachability: { disableReachabilityChecks: true },
    steps,
    title: "Record new case",
    view: { template: "partials/form-step" },
  });

  const testPackage = createTestPackage({
    functions: JourneyEffectsImplementations,
    journey: testJourney,
  });

  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents([autocomplete])
    .registerGlobalFunctions(nunjucksFunctions)
    .registerPackage(testPackage)
    .createClient();
}

/**
 * Creates a test client for a single-step journey under /case-list.
 * @param {...any} steps - Step definitions to include in the test journey.
 * @returns {ForgeTestClient} A configured test client.
 */
export function createForgeTestClientForCaseList(
  ...steps: StepDefinition[]
): ForgeTestClient {
  const testJourney = journey({
    code: "yourCases",
    onAccess: [
      access({
        effects: [CaseListEffects.LoadCaseList()],
      }),
    ],
    path: "/your-cases",
    reachability: { disableReachabilityChecks: true },
    steps,
    title: "Your Cases",
    view: { template: "partials/case-list-step" },
  });

  const testPackage = createTestPackage({
    functions: CaseListEffectsImplementations,
    journey: testJourney,
  });

  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents(mojComponents)
    .registerGlobalFunctions(nunjucksFunctions)
    .registerPackage(testPackage)
    .createClient();
}
