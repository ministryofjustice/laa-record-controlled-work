import { TestResult } from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { ineligibleStep } from "#/journeys/create-application/steps/1-ecf-dropout.step.js";
import { ecfStep } from "#/journeys/create-application/steps/1-ecf.step.js";
import { createStepClient } from "../../utils/helpers.js";

describe("ECF step", () => {

  const client = createStepClient(ecfStep("testJourney"), ineligibleStep("testJourney"));

  it("should render the ECF form on GET", async () => {
    const result = await client.get("/create-application/ecf");
    expect(result.type).to.equal("render");
  });

  it("should show validation error if no option is selected", async () => {
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
