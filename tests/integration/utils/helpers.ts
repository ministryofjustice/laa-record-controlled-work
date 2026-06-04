import {
  journey,
  type StepDefinition,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  createTestPackage,
  type ForgeTestClient,
  ForgeTestHarness,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";

import { JourneyEffectsImplementations } from "#/journeys/effects.js";

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
    .registerPackage(testPackage)
    .createClient();
}
