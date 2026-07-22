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
import { YourCasesEffectsDeps } from "#/journeys/your-cases/your-cases.types.js";
import { yourCasesEffectsRegistry } from "#/journeys/your-cases/your-cases.effects.js";

/**
 * Creates a test client for a single-step journey under /cases/new.
 * @param {...any} steps - Step definitions to include in the test journey.
 * @returns {ForgeTestClient} A configured test client.
 */
export function createForgeTestClient(
  title: string,
  path: string,
  ...steps: StepDefinition[]
): ForgeTestClient {
  const testJourney = journey({
    code: "testJourney",
    path: path,
    onAccess: [
      access({
        effects: [JourneyEffects.LoadDraftAnswers("testJourney")],
      }),
    ],
    reachability: { disableReachabilityChecks: true },
    steps,
    title: title,
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
 * Creates a test client for a single-step journey under /cases.
 * @param {Record<string, FunctionEvaluator>} mockYourCasesEffectsDeps - mock implementations for the journey's effect functions
 * @param {...any} steps - Step definitions to include in the test journey.
 * @returns {ForgeTestClient} A configured test client.
 */
export function createForgeTestClientForCaseList(
  mockYourCasesEffectsDeps: YourCasesEffectsDeps,
  ...steps: StepDefinition[]
): ForgeTestClient {
  
  const testJourney = journey({
    code: "yourCases",
    path: "/",
    reachability: { disableReachabilityChecks: true },
    steps,
    title: "Your Cases",
    view: { template: "partials/case-list-step" },
  });

  const testPackage = createTestPackage({
    functions: yourCasesEffectsRegistry,
    journey: testJourney,
  });

  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents(mojComponents)
    .registerGlobalFunctions(nunjucksFunctions)
    .registerPackage(testPackage, mockYourCasesEffectsDeps)
    .createClient();
}