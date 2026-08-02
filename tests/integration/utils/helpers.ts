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
import type { SelectOfficeEffectsDeps } from "#/journeys/select-office/select-office.types.js";
import { selectOfficeEffectsRegistry } from "#/journeys/select-office/select-office.effects.js";
import { selectOfficeJourney } from "#/journeys/select-office/select-office.journey.js";
import type { YourCasesEffectsDeps } from "#/journeys/your-cases/your-cases.types.js";
import { yourCasesPackage } from "#/journeys/your-cases/your-cases.journey.js";

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
 * Creates a test client for the select office journey.
 * @param {SelectOfficeEffectsDeps} mockDeps - mock implementations for the journey's effect functions
 * @returns {ForgeTestClient} A configured test client.
 */
export function createForgeTestClientForSelectOffice(
  mockDeps: SelectOfficeEffectsDeps,
): ForgeTestClient {
  const testPackage = createTestPackage({
    functions: selectOfficeEffectsRegistry,
    journey: selectOfficeJourney,
  });

  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalFunctions(nunjucksFunctions)
    .registerPackage(testPackage, mockDeps)
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
): ForgeTestClient {
  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents(mojComponents)
    .registerGlobalFunctions(nunjucksFunctions)
    .registerPackage(yourCasesPackage, mockYourCasesEffectsDeps)
    .createClient();
}
