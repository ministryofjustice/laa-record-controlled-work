import {
  ForgeTestHarness,
  TestResult,
  createTestPackage,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { expect } from "chai";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";
import { haveAHomeAddressStep } from "#/journeys/create-application/steps/6-have-a-home-address.step.js";

const singleStepJourney = journey({
  path: "/create-application",
  code: "testJourney",
  reachability: { disableReachabilityChecks: true },
  steps: [haveAHomeAddressStep("testJourney")],
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

describe("Have A Home Address Step", () => {

  const client = createClient();

  it("should render the have a home address form on GET", async () => {
    const result = await client.get("/create-application/have-a-home-address");
    expect(result.type).to.equal("render");
  });

  it("should show validation error if no option is selected", async () => {
    const result = await client.post("/create-application/have-a-home-address", {
      body: {},
    });
    expect(result.type).to.equal("render");
    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);
      expect(result.context.fieldValidationErrors[0].message).to.deep.equal(
        "Select if your client has a home address",
      );
    }
  });

  it("should redirect to Enter address manually step if yes", async () => {
    const result: TestResult = await client.post("/create-application/have-a-home-address", {
      body: {
        haveAHomeAddress: "yes",
      },
    });
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/enter-address-manually");
    }
  });

  it("should redirect to Need means assessment step if no", async () => {
    const result = await client.post("/create-application/have-a-home-address", {
      body: {
        haveAHomeAddress: "no",
      },
    });
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/need-means-assessment");
    }
  });
});
