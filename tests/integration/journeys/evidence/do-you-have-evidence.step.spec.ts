import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { doYouHaveEvidence } from "#/journeys/evidence/steps/do-you-have-evidence/do-you-have-evidence.step.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";

describe("Do you have evidence step", () => {
  const client = createForgeTestClient(
    "Evidence",
    "/cases/evidence",
    doYouHaveEvidence("testJourney"),
  );

  describe("GET /cases/evidence/have-evidence", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/evidence/have-evidence");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Do you have evidence of your client's financial eligibility?",
      );
    });

    it("renders two radio options", () => {
      const buttons = radioInput.properties.items as { text: string }[];
      expect(buttons.length).to.equal(2);
      expect(buttons[0].text).to.equal("Yes");
      expect(buttons[1].text).to.equal("No");
    });
  });

  describe("POST /cases/evidence/have-evidence", () => {
    const fieldCode = "doYouHaveEvidence";
    
    it("should show validation error if no option is selected", async () => {
      const result = await client.post("/cases/evidence/have-evidence");
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
      ).to.deep.equal("Please select an option to continue");
    });

    it("should redirect to reason for no evidence step if no is selected", async () => {
      const result = await client.post("/cases/evidence/have-evidence", {
        body: {
          doYouHaveEvidence: "no",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/evidence/reason-for-no-evidence");
    });

    it("should redirect to evidence of income step if yes is selected", async () => {
      const result = await client.post("/cases/evidence/have-evidence", {
        body: {
          doYouHaveEvidence: "yes",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        "/cases/evidence/evidence-of-income",
      );
    });
  });
});
