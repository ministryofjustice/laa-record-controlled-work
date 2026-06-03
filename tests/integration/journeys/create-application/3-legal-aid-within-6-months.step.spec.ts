import {
  ForgeTestHarness,
  TestResult,
  createTestPackage,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { expect } from "chai";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";
import { legalAidBefore6MonthsStep } from "#/journeys/create-application/steps/3-legal-aid-within-6-months.step.js";

const singleStepJourney = journey({
  path: "/create-application",
  code: "testJourney",
  reachability: { disableReachabilityChecks: true },
  steps: [legalAidBefore6MonthsStep("testJourney")],
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

describe("Legal aid before 6 months step", () => {
    
  const client = createClient();

  it("should render the legal aid before 6 months form on GET", async () => {
    const result = await client.get(
      "/create-application/legal-aid-last-6-months",
    );
    expect(result.type).to.equal("render");
  });

  it("should show validation error if no option is selected", async () => {
    const result = await client.post(
      "/create-application/legal-aid-last-6-months",
      {
        body: {},
      },
    );
    expect(result.type).to.equal("render");
    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);
      expect(result.context.fieldValidationErrors[0].message).to.deep.equal(
        "Select if your client got legal help for this matter in the last 6 months",
      );
    }
  });

  it("should show validation error if yes is selected but no reason is given", async () => {
    const result = await client.post(
      "/create-application/legal-aid-last-6-months",
      {
        body: { legalAidLast6Months: "yes" },
      },
    );
    expect(result.type).to.equal("render");
    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);
      expect(result.context.fieldValidationErrors[0].message).to.deep.equal(
        "Enter the reason you’re creating a new case for the same matter",
      );
    }
  });

  it("should redirect to legal aid last 6 months step if yes", async () => {
    const result: TestResult = await client.post(
      "/create-application/legal-aid-last-6-months",
      {
        body: {
          legalAidLast6Months: "yes",
          reasonForYes: "Some reason",
        },
      },
    );
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/client-details");
    }
  });

  it("should redirect to client details step if no, different matter", async () => {
    const result = await client.post(
      "/create-application/legal-aid-last-6-months",
      {
        body: {
          legalAidLast6Months: "no",
        },
      },
    );
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/client-details");
    }
  });
});
