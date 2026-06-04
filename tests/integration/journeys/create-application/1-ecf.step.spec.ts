import { TestRenderResult, TestRedirectResult } from "@ministryofjustice/hmpps-forge/core/testing";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { expect } from "chai";
import { ineligibleStep } from "#/journeys/create-application/steps/1-ecf-dropout.step.js";
import { ecfStep } from "#/journeys/create-application/steps/1-ecf.step.js";
import { createStepClient } from "../../utils/helpers.js";

describe("ECF step", () => {

  const client = createStepClient(ecfStep("testJourney"), ineligibleStep("testJourney"));

  describe("GET /create-application/ecf", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/create-application/ecf");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Does this case require Exceptional Case Funding?",
      );
    });

    it("renders two radio options", () => {
      const buttons = radioInput.properties.items as { text: string }[];
      expect(buttons.length).to.equal(2);
      expect(buttons[0].text).to.equal("Yes");
      expect(buttons[1].text).to.equal("No");
    });
  });

  it("should show validation error if no option is selected", async () => {
    const result = await client.post("/create-application/ecf");
    expect(result.type).to.equal("render");
    const renderResult = result as TestRenderResult;
    expect(renderResult.context.showValidationFailures).to.equal(true);
    expect(renderResult.context.fieldValidationErrors[0].message).to.deep.equal(
      "Please select an option",
    );
  });

  it("should redirect to ineligible step if ECF is not required", async () => {
    const result = await client.post("/create-application/ecf", {
      body: {
        ecf: "yes",
      },
    });
    expect(result.type).to.equal("redirect");
    const redirectResult = result as TestRedirectResult;
    expect(redirectResult.url).to.equal("/create-application/ecf-dropout");
  });

  it("should redirect to legal aid before step if ECF is not required", async () => {
    const result = await client.post("/create-application/ecf", {
      body: {
        ecf: "no",
      },
    });
    expect(result.type).to.equal("redirect");
    const redirectResult = result as TestRedirectResult;
    expect(redirectResult.url).to.equal("/create-application/legal-aid-before");
  });
});
