import {
  ForgeTestHarness,
  createTestPackage,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { govukComponents } from "@ministryofjustice/hmpps-forge/govuk-components";
import { expect } from "chai";
import { JourneyEffectsImplementations } from "#/journeys/effects.js";
import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";
import { clientDetailsStep } from "#/journeys/create-application/steps/4-client-details.step.js";

const singleStepJourney = journey({
  path: "/create-application",
  code: "testJourney",
  reachability: { disableReachabilityChecks: true },
  steps: [clientDetailsStep("testJourney")],
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

describe("Client details step", () => {
  const client = createClient();

  it("should render the client details form on GET", async () => {
    const result = await client.get("/create-application/client-details");
    expect(result.type).to.equal("render");
  });

  it("should redirect to the check answers page when given valid data", async () => {
    const result = await client.post("/create-application/client-details", {
      body: {
        fullName: "John Doe",
        dateOfBirth: { year: "2000", month: "2", day: "2" }
      } as unknown as Record<string, string | string[]>,
    });

    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/ni-number");
    }
  });

  it("should show validation error if no name is provided", async () => {
    const result = await client.post("/create-application/client-details", {
      body: {},
    });
    expect(result.type).to.equal("render");

    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);

      expect(
        result.getValidationErrorsByFieldCode("fullName")[0].message,
      ).to.deep.equal("Enter your client's name");
    }
  });

  it("should show validation error if no date is provided", async () => {
    const result = await client.post("/create-application/client-details", {
      body: {
        fullName: "John Doe",
        dateOfBirth: { year: "", month: "", day: "" }
      } as unknown as Record<string, string | string[]>,
    });
    expect(result.type).to.equal("render");

    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);

      expect(
        result.getValidationErrorsByFieldCode("dateOfBirth")[0].message,
      ).to.deep.equal("Enter your client's date of birth");
    }
  });

  it("should show validation error if date is incorrect", async () => {
    const result = await client.post("/create-application/client-details", {
      body: {
        fullName: "John Doe",
        dateOfBirth: { year: "2000", month: "2", day: "31" }
      } as unknown as Record<string, string | string[]>,
    });

    expect(result.type).to.equal("render");

    if (result.type === "render") {

      expect(result.context.showValidationFailures).to.equal(true);
      expect(
        result.getValidationErrorsByFieldCode("dateOfBirth")[0].message,
      ).to.deep.equal("Date of birth must be a real date");
    }
  });

    it("should show validation error if day is missing", async () => {
      const result = await client.post("/create-application/client-details", {
        body: {
          fullName: "John Doe",
        dateOfBirth: { year: "2000", month: "2", day: "" }
      } as unknown as Record<string, string | string[]>,
      });

      expect(result.type).to.equal("render");
      if (result.type === "render") {

        expect(result.context.showValidationFailures).to.equal(true);
        expect(
          result.getValidationErrorsByFieldCode("dateOfBirth")[0].message,
        ).to.deep.equal("Date of birth must include a day");
      }
    });

    it("should show validation error if month is missing", async () => {
      const result = await client.post("/create-application/client-details", {
        body: {
          fullName: "John Doe",
        dateOfBirth: { year: "2000", month: "", day: "1" }
      } as unknown as Record<string, string | string[]>,
      });

      expect(result.type).to.equal("render");
      if (result.type === "render") {

        expect(result.context.showValidationFailures).to.equal(true);
        expect(
          result.getValidationErrorsByFieldCode("dateOfBirth")[0].message,
        ).to.deep.equal("Date of birth must include a month");
      }
    });

    it("should show validation error if year is missing", async () => {
      const result = await client.post("/create-application/client-details", {
        body: {
          fullName: "John Doe",
          dateOfBirth: { year: "", month: "2", day: "15" }
        } as unknown as Record<string, string | string[]>,
      });

      expect(result.type).to.equal("render");
      if (result.type === "render") {

        expect(result.context.showValidationFailures).to.equal(true);
        expect(
          result.getValidationErrorsByFieldCode("dateOfBirth")[0].message,
        ).to.deep.equal("Date of birth must include a year");
      }
    });

  it("should show validation error if date is in the future", async () => {
    const result = await client.post("/create-application/client-details", {
      body: {
        fullName: "John Doe",
        dateOfBirth: { year: "3000", month: "12", day: "31" }
      } as unknown as Record<string, string | string[]>,
    });

    expect(result.type).to.equal("render");
    if (result.type === "render") {

      expect(result.context.showValidationFailures).to.equal(true);
      expect(
        result.getValidationErrorsByFieldCode("dateOfBirth")[0].message,
      ).to.deep.equal("Date of birth must be in the past");
    }
  });
});
