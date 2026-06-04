import {
  ForgeTestHarness,
  TestResult,
  createTestPackage,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { expect } from "chai";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";
import { niNumberStep } from "#/journeys/create-application/steps/5-ni-number.step.js";

const singleStepJourney = journey({
  path: "/create-application",
  code: "testJourney",
  reachability: { disableReachabilityChecks: true },
  steps: [niNumberStep("testJourney")],
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

describe("NI number step", () => {
  const client = createClient();

  it("should render the NI number form on GET", async () => {
    const result = await client.get("/create-application/ni-number");
    expect(result.type).to.equal("render");
  });

  it("should show validation error if no option is selected", async () => {
    const result = await client.post("/create-application/ni-number", {
      body: {},
    });
    expect(result.type).to.equal("render");
    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);
      expect(result.context.fieldValidationErrors[0].message).to.deep.equal(
        "Select if your client has a National Insurance number",
      );
    }
  });

  it("should show validation error if yes is selected but no reason is given", async () => {
    const result = await client.post("/create-application/ni-number", {
      body: { hasNINumber: "yes" },
    });
    expect(result.type).to.equal("render");
    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);
      expect(result.context.fieldValidationErrors[0].message).to.deep.equal(
        "Enter your client's National Insurance number",
      );
    }
  });

  it("should show validation error if yes is selected and NI number is invalid", async () => {
    const result = await client.post("/create-application/ni-number", {
      body: { hasNINumber: "yes", niNumber: "ZZ123456C" },
    });
    expect(result.type).to.equal("render");
    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);
      expect(result.context.fieldValidationErrors[0].message).to.deep.equal(
        "Enter a National Insurance number that is 2 letters, 6 numbers, then A, B, C or D, like QQ 12 34 56 C",
      );
    }
  });

  it("should redirect to has home address step if yes and NI number is provided", async () => {
    const result: TestResult = await client.post(
      "/create-application/ni-number",
      {
        body: {
          hasNINumber: "yes",
          niNumber: "JN123456A",
        },
      },
    );
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal(
        "/create-application/does-client-have-address",
      );
    }
  });

  it("should redirect to has home address step if no", async () => {
    const result = await client.post("/create-application/ni-number", {
      body: {
        hasNINumber: "no",
      },
    });
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal(
        "/create-application/does-client-have-address",
      );
    }
  });
});
