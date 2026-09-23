import {
  createForgePackage,
  type BaseFunctionRegistry,
  type JourneyDefinition,
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
import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";
import { createApplicationTransformersRegistry } from "#/journeys/create-application/create-application.transformers.js";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";


/**
 * Creates an integration test client from a journey definition.
 * @param journey Source journey — provides code, path, onAccess, steps, title and view.
 * @param effectsRegistry Journey function registry to register for the test package.
 * @param overrides Optional overrides for steps, access hooks, and dependencies.
 */
export function createForgeTestClient<TDeps>(
  sourceJourney: JourneyDefinition,
  effectsRegistry: BaseFunctionRegistry<TDeps>,
  overrides?: {
    additionalFunctions?: BaseFunctionRegistry<TDeps>[];
    dependencies?: TDeps;
  },
): ForgeTestClient {


  sourceJourney.reachability = { disableReachabilityChecks: true };

  const testPackage = createTestPackage(
    createForgePackage({
      functions: [
        effectsRegistry,
        ...(overrides?.additionalFunctions ?? []),
      ],
      journey: sourceJourney,
    }),
  );
  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents(mojComponents)
    .registerGlobalComponents([autocomplete])
    .registerGlobalFunctions(nunjucksFunctions)
    .registerGlobalFunctions(JourneyEffectsImplementations)
    .registerPackage(testPackage, overrides?.dependencies)
    .createClient();
}

export function createApplicationTestClient(
  sourceJourney: JourneyDefinition,
  effectsRegistry: BaseFunctionRegistry<CreateApplicationEffectsDeps>,
  overrides?: {
    dependencies?: CreateApplicationEffectsDeps;
  },
): ForgeTestClient {
  return createForgeTestClient(sourceJourney, effectsRegistry, {
    additionalFunctions: [createApplicationTransformersRegistry],
    dependencies: overrides?.dependencies,
  });
}