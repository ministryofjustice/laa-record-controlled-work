import {
  ForgeTestHarness,
  TestResult,
  createTestPackage,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { expect } from "chai";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { legalAidBeforeStep } from "#/journeys/create-application/steps/2-legal-aid-before.step.js";
import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";

const singleStepJourney = journey({
  path: "/create-application",
  code: "testJourney",
  reachability: { disableReachabilityChecks: true },
  steps: [legalAidBeforeStep("testJourney")],
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

describe("Legal aid before step", () => {
  it("should render the legal aid before form on GET", async () => {
    const client = createClient();
    const result = await client.get("/create-application/legal-aid-before");
    expect(result.type).to.equal("render");
  });

  it("should show validation error if no option is selected", async () => {
    const client = createClient();
    const result = await client.post("/create-application/legal-aid-before", {
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

  it("should redirect to legal aid last 6 months step if yes, same matter", async () => {
    const client = createClient();
    const result: TestResult = await client.post("/create-application/legal-aid-before", {
      body: {
        legalAidBefore: "yesSameMatter",
      },
    });
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/legal-aid-last-6-months");
    }
  });

  it("should redirect to client details step if yes, different matter", async () => {
    const client = createClient();
    const result: TestResult = await client.post("/create-application/legal-aid-before", {
      body: {
        legalAidBefore: "yesDifferentMatter",
      },
    });
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/client-details");
    }
  });

  it("should redirect to client details step if no, different matter", async () => {
    const client = createClient();
    const result = await client.post("/create-application/legal-aid-before", {
      body: {
        legalAidBefore: "no",
      },
    });
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/client-details");
    }
  });
});
