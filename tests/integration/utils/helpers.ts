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
import type { ForgeRenderer } from "@ministryofjustice/hmpps-forge/core/framework";
import { nunjucksFunctions } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { mojComponents } from "@ministryofjustice/hmpps-forge/moj-components";

import { autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";
import { createApplicationTransformersRegistry } from "#/journeys/create-application/create-application.transformers.js";
import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";
import { editApplicationEffectsRegistry } from "#/journeys/edit-application/editApplication.effects.js";
import { editApplicationJourney } from "#/journeys/edit-application/editApplication.journey.js";
import { editApplicationTransformersRegistry } from "#/journeys/edit-application/editApplication.transformers.js";
import { evidenceEffectsRegistry } from "#/journeys/evidence/evidence.effects.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

/**
 * Creates an integration test client from a journey definition.
 * @param journey Source journey — provides code, path, onAccess, steps, title and view.
 * @param effectsRegistry Journey function registry to register for the test package.
 * @param overrides Optional overrides for steps, access hooks, and dependencies.
 */
export function createForgeTestClient<TDeps>(
  sourceJourney: JourneyDefinition,
  effectsRegistry:
    | BaseFunctionRegistry<TDeps>
    | BaseFunctionRegistry<TDeps>[],
  overrides?: {
    additionalFunctions?: BaseFunctionRegistry<TDeps>[];
    dependencies?: TDeps;
    disableReachabilityChecks?: boolean;
    renderer?: ForgeRenderer<unknown>;
  },
): ForgeTestClient {


  sourceJourney.reachability = {
    disableReachabilityChecks:
      overrides?.disableReachabilityChecks ?? true,
  };

  const testPackage = createTestPackage(
    createForgePackage({
      functions: [
        ...(Array.isArray(effectsRegistry)
          ? effectsRegistry
          : [effectsRegistry]),
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
    .registerPackage(testPackage, overrides?.dependencies)
    .createClient(overrides?.renderer);
}

export function createEvidenceJourneyTestClient(
  dependencies: Partial<EditApplicationEffectsDeps> = {},
): ForgeTestClient {
  const application = getGetApplicationResponseMock({ evidence: null });

  return createForgeTestClient(
    editApplicationJourney,
    [editApplicationEffectsRegistry, evidenceEffectsRegistry],
    {
      additionalFunctions: [editApplicationTransformersRegistry],
      dependencies: {
        getApplication: async () => ({ status: 200, data: application }),
        updateApplicationDetails: async () => ({ status: 204 }),
        updateApplicationEvidence: async () => ({ status: 204 }),
        updateApplicationStatus: async () => ({ status: 204 }),
        ...dependencies,
      },
    },
  );
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