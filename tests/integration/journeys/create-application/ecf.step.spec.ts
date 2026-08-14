import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import {
  CreateApplicationEffects,
  createApplicationEffectsRegistry,
} from "#/journeys/create-application/create-application.effects.js";
import { ineligibleStep } from "#/journeys/create-application/steps/ecf-dropout.step.js";
import { ecfStep } from "#/journeys/create-application/steps/ecf.step.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";

describe("ECF step", () => {
  const client = createForgeTestClient(
    createApplicationJourney,
    createApplicationEffectsRegistry,
    {
      steps: [
        ecfStep("createApplication"),
        ineligibleStep("createApplication"),
      ],
    },
  );

  describe("GET /cases/new/ecf", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/new/ecf");
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

  describe("POST /cases/new/ecf", () => {
    const fieldCode = "ecf";
    
    it("should show validation error if no option is selected", async () => {
      const result = await client.post("/cases/new/ecf");
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
      ).to.deep.equal("Please select an option");
    });

    it("should redirect to ineligible step if ECF is not required", async () => {
      const result = await client.post("/cases/new/ecf", {
        body: {
          ecf: "yes",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/ecf-dropout");
    });

    it("should redirect to legal aid before step if ECF is not required", async () => {
      const result = await client.post("/cases/new/ecf", {
        body: {
          ecf: "no",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        "/cases/new/legal-aid-before",
      );
    });
  });
});
