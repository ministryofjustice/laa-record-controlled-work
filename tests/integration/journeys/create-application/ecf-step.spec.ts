import {
  ForgeTestHarness,
  TestResult,
  createTestPackage,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { expect } from "chai";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";
import { ineligibleStep } from "#/journeys/create-application/steps/1-ecf-dropout.step.js";
import { ecfStep } from "#/journeys/create-application/steps/1-ecf.step.js";

const singleStepJourney = journey({
  path: "/create-application",
  code: "testJourney",
  reachability: { disableReachabilityChecks: true },
  steps: [ecfStep("testJourney"), ineligibleStep("testJourney")],
  title: "Record new case",
  view: { template: "partials/form-step" },
});

const basePackage = {
  journey: singleStepJourney,
  functions: JourneyEffectsImplementations,
};

const testPackage = createTestPackage(basePackage);

function createClient() {
  return new ForgeTestHarness()
    .registerGlobalComponents(govukComponents)
    .registerPackage(testPackage)
    .createClient();
}

describe("ECF step", () => {
  it("should render the ECF form on GET", async () => {
    const client = createClient();
    const result = await client.get("/create-application/ecf");
    expect(result.type).to.equal("render");
  });

  it("should show validation error if no option is selected", async () => {
    const client = createClient();
    const result = await client.post("/create-application/ecf", {
      body: {},
    });
    expect(result.type).to.equal("render");
    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);
      expect(result.context.fieldValidationErrors[0].message).to.deep.equal(
        "Please select an option",
      );
    }
  });

  it("should redirect to ineligible step if ECF is not required", async () => {
    const client = createClient();
    const result: TestResult = await client.post("/create-application/ecf", {
      body: {
        ecf: "yes",
      },
    });
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/ecf-dropout");
    }
  });

  it("should redirect to legal aid before step if ECF is not required", async () => {
    const client = createClient();
    const result = await client.post("/create-application/ecf", {
      body: {
        ecf: "no",
      },
    });
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/legal-aid-before");
    }
  });
});
