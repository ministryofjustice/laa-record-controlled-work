import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { legalAidBeforeStep } from "#/journeys/create-application/steps/2-legal-aid-before.step.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";

describe("Legal aid before step", () => {
  const client = createForgeTestClient(legalAidBeforeStep("testJourney"));

  describe("GET /create-application/legal-aid-before", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/create-application/legal-aid-before");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Has your client accessed legal aid before?",
      );
    });

    it("renders three radio options", () => {
      const buttons = radioInput.properties.items as { text: string }[];
      expect(buttons.length).to.equal(3);
      expect(buttons[0].text).to.equal("Yes, about the same matter");
      expect(buttons[1].text).to.equal("Yes, about a different matter");
      expect(buttons[2].text).to.equal("No");
    });
  });

  describe("POST /create-application/legal-aid-before", () => {
    const fieldCode = "legalAidBefore";
    
    it("should show validation error if no option is selected", async () => {
      const result = await client.post("/create-application/legal-aid-before", {
        body: {},
      });
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
      ).to.deep.equal("Please select an option");
    });

    it("should redirect to legal aid last 6 months step if yes, same matter", async () => {
      const result = await client.post("/create-application/legal-aid-before", {
        body: {
          legalAidBefore: "yesSameMatter",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        "/create-application/legal-aid-last-6-months",
      );
    });

    it("should redirect to client details step if yes, different matter", async () => {
      const result = await client.post("/create-application/legal-aid-before", {
        body: {
          legalAidBefore: "yesDifferentMatter",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/create-application/client-details");
    });

    it("should redirect to client details step if no, different matter", async () => {
      const result = await client.post("/create-application/legal-aid-before", {
        body: {
          legalAidBefore: "no",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/create-application/client-details");
    });
  });
});
