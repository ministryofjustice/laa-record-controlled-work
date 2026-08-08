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
import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";
import type { CreateApplicationEffectsDeps } from "#/journeys/create-application/create-application.types.js";
import { editApplicationEffectsRegistry } from "#/journeys/edit-application/editApplication.effects.js";
import type { EditApplicationEffectsDeps } from "#/journeys/edit-application/editApplication.types.js";
import sinon from "sinon";
import { getCreateApplicationResponseMock, getGetApplicationResponseMock } from "../../mocks/api/rcw/fakers/applications/applications.faker.gen.js";

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
  const mockData = getCreateApplicationResponseMock({id: uuid});
  const createApplicationStub = sinon
    .stub()
    .resolves({ status: 201, data: mockData });

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
    .registerPackage(testPackage, mockDeps ?? { createApplication: createApplicationStub })
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
    .registerGlobalFunctions(JourneyEffectsImplementations)
    .createClient();
}

/**
 * Creates a test client for edit-application journey.
 * @param {string} title - The title of the journey.
 * @param {string} path - The path of the journey.
 * @param {...any} steps - Step definitions to include in the test journey.
 * @param {EditApplicationEffectsDeps} mockDeps - mock implementations for the journey's effect functions
 * @returns {ForgeTestClient} A configured test client.
 */
export function createForgeTestClientForEditApplication(
  title: string,
  path: string,
  steps: StepDefinition[],
  mockDeps?: EditApplicationEffectsDeps,
): ForgeTestClient {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";
  const mockData = getGetApplicationResponseMock({
    id: uuid,
    applicationStatus: "DRAFT",
    applicationState: "DRAFT",
    declaration: {
      clientDeclarationStatus: "DRAFT",
      declarationConfirmation: false,
      createdAt: new Date().toISOString().slice(0, 19) + "Z",
      createdBy: "test",
      modifiedAt: new Date().toISOString().slice(0, 19) + "Z",
      modifiedBy: "test",
    },
    evidence: {
      evidenceStatus: "DRAFT",
      payeIncomeEvidence: false,
      otherIncomeEvidence: false,
      housingCostsEvidence: false,
      capitalEvidence: false,
      createdAt: new Date().toISOString().slice(0, 19) + "Z",
      createdBy: "test",
      modifiedAt: new Date().toISOString().slice(0, 19) + "Z",
      modifiedBy: "test",
    },
  });
  const getApplicationStub = sinon
    .stub()
    .resolves({ status: 200, data: mockData });

  const testJourney = journey({
    code: "testJourney",
    path: path,
    reachability: { disableReachabilityChecks: true },
    steps,
    title: title,
    view: { template: "partials/form-step" },
  });

  const testPackage = createTestPackage({
    functions: editApplicationEffectsRegistry,
    journey: testJourney,
  });

  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerGlobalComponents([autocomplete])
    .registerGlobalFunctions(nunjucksFunctions)
    .registerGlobalFunctions(JourneyEffectsImplementations)
    .registerPackage(testPackage, mockDeps ?? { getApplication: getApplicationStub })
    .createClient();
}
