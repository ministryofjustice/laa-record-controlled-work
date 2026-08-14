import {
  access,
  journey,
  type StepDefinition,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import type {
  AccessHook,
  EffectFunctionExpr,
  JourneyDefinition,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import type {
  ForgePackageFunctions,
  ForgePackageRegistration,
} from "@ministryofjustice/hmpps-forge/core";
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
  JourneyEffectShape,
  JourneyEffectsImplementations,
} from "#/journeys/effects.js";
import type { SelectOfficeEffectsDeps } from "#/journeys/select-office/select-office.types.js";
import { selectOfficeEffectsRegistry } from "#/journeys/select-office/select-office.effects.js";
import { selectOfficeJourney } from "#/journeys/select-office/select-office.journey.js";
import type { YourCasesEffectsDeps } from "#/journeys/your-cases/your-cases.types.js";
import { yourCasesPackage } from "#/journeys/your-cases/your-cases.journey.js";
import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";
import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";
import { editApplicationEffectsRegistry } from "#/journeys/edit-application/editApplication.effects.js";
import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";
import { evidenceEffectsRegistry } from "#/journeys/evidence/evidence.effects.js";
import type { EvidenceEffectsDeps } from "#/journeys/evidence/evidence.types.js";
import sinon from "sinon";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { getCreateApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { taskListStep } from "#/journeys/edit-application/steps/task-list/task-list.step.js";

/**

 * Creates a test client for a single-step journey under /create-application.
 * @param {string} title - The title of the journey.
 * @param {string} path - The path of the journey.
 * @param {...any} steps - Step definitions to include in the test journey.
 * @returns {ForgeTestClient} A configured test client.
 */
export function createForgeTestClient(
  title: string,
  path: string,
  steps: StepDefinition[],
  mockDeps?: CreateApplicationEffectsDeps,
): ForgeTestClient {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";
  const mockData = getCreateApplicationResponseMock({ id: uuid });
  const createApplicationStub = sinon
    .stub()
    .resolves({ status: 201, data: mockData, headers: new Headers() });

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
    functions: createApplicationEffectsRegistry,
    journey: testJourney,
  });

  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents([autocomplete])
    .registerGlobalFunctions(nunjucksFunctions)
    .registerGlobalFunctions(JourneyEffectsImplementations)
    .registerPackage(
      testPackage,
      mockDeps ?? { createApplication: createApplicationStub },
    )
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
    .registerGlobalFunctions(JourneyEffectsImplementations)
    .createClient();
}

/**
 * Creates a test client for edit-application journey.
 * @param {EditApplicationEffectsDeps} mockDeps - mock implementations for the journey's effect functions
 * @returns {ForgeTestClient} A configured test client.
 */
export function createForgeTestClientForEditApplication(
  mockDeps?: EditApplicationEffectsDeps,
): ForgeTestClient {
  const mockData = getGetApplicationResponseMock();
  const getApplicationStub = sinon
    .stub()
    .resolves({ status: 200, data: mockData });

  const testJourney = journey({
    code: "testJourney",
    path: "/cases/:applicationID/",
    reachability: { disableReachabilityChecks: true },
    steps: [taskListStep()],
    title: "Edit case",
    view: { template: "partials/form-step" },
  });

  const testPackage = createTestPackage({
    functions: editApplicationEffectsRegistry,
    journey: testJourney,
  });

  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents(mojComponents)
    .registerGlobalComponents([autocomplete])
    .registerGlobalFunctions(nunjucksFunctions)
    .registerGlobalFunctions(JourneyEffectsImplementations)
    .registerPackage(
      testPackage,
      mockDeps ?? { getApplication: getApplicationStub },
    )
    .createClient();
}

/**
 * Creates a generic integration test client for a test journey and function registry.
 * @param options The test client configuration.
 * @param options.steps Step definitions to mount in the test journey.
 * @param options.path Base path for the test journey.
 * @param options.journeyCode Journey code for the generated test journey.
 * @param options.accessHooks Explicit access hooks to mount on the journey. Use this when the journey needs redirects or multiple access phases.
 * @param options.testEffects Journey function registry or registries to register for the test package.
 * @param options.mockDeps Optional dependency object matching the test effects deps type.
 * @returns {ForgeTestClient} A configured test client.
 */
export function createTestClient<TDeps>(
  options: {
    steps: StepDefinition[];
    path: string;
    journeyCode: string;
    accessHooks?: AccessHook[];
    testEffects: ForgePackageRegistration<TDeps>["functions"];
    mockDeps?: TDeps;
  },
): ForgeTestClient {
  const {
    accessHooks,
    journeyCode,
    mockDeps,
    path,
    steps,
    testEffects,
  } = options;



  const testJourney = journey({
    code: journeyCode,
    path: path,
    ...(accessHooks && { onAccess: accessHooks }),
    reachability: { disableReachabilityChecks: true },
    steps: steps,
    title: "Test Journey",
    view: { template: "partials/form-step" },
  });

  const testPackage = createTestPackage({
    functions: testEffects,
    journey: testJourney,
  });
  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents(mojComponents)
    .registerGlobalComponents([autocomplete])
    .registerGlobalFunctions(nunjucksFunctions)
    .registerGlobalFunctions(JourneyEffectsImplementations)
    .registerPackage(testPackage, mockDeps)
    .createClient();
}