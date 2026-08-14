import {
  journey,
  type AccessHook,
  type JourneyDefinition,
  type StepDefinition,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import type { ForgePackageRegistration } from "@ministryofjustice/hmpps-forge/core";
import {
  createTestPackage,
  type ForgeTestClient,
  ForgeTestHarness,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { nunjucksFunctions } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { mojComponents } from "@ministryofjustice/hmpps-forge/moj-components";

import { autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";


/**
 * Creates an integration test client from a journey definition.
 * @param journey Source journey — provides code, path, onAccess, steps, title and view.
 * @param effectsRegistry Journey function registry to register for the test package.
 * @param overrides Optional overrides for steps, access hooks, and dependencies.
 */
export function createForgeTestClient<TDeps>(
  sourceJourney: JourneyDefinition,
  effectsRegistry: ForgePackageRegistration<TDeps>["functions"],
  overrides?: {
    accessHooks?: AccessHook[];
    dependencies?: TDeps;
    steps?: StepDefinition[];
  },
): ForgeTestClient {
  const onAccess = overrides?.accessHooks ?? sourceJourney.onAccess;
  const testJourney = journey({
    code: sourceJourney.code,
    path: sourceJourney.path,
    ...(onAccess && { onAccess }),
    reachability: { disableReachabilityChecks: true },
    steps: overrides?.steps ?? sourceJourney.steps,
    title: sourceJourney.title,
    view: sourceJourney.view,
  });

  const testPackage = createTestPackage({
    functions: effectsRegistry,
    journey: testJourney,
  });
  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents(mojComponents)
    .registerGlobalComponents([autocomplete])
    .registerGlobalFunctions(nunjucksFunctions)
    .registerGlobalFunctions(JourneyEffectsImplementations)
    .registerPackage(testPackage, overrides?.dependencies)
    .createClient();
}