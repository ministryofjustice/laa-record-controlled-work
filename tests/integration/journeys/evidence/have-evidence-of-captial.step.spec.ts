import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { evidencePackage } from "#/journeys/evidence/evidence.package.js";
import { evidenceJourney } from "#/journeys/evidence/evidence.journey.js";

describe("Do you have evidence of capital step", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";
  const client = createForgeTestClient(
    evidenceJourney,
    evidencePackage.functions,
  );

  describe("GET /cases/evidence/have-evidence-of-capital", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get(`/cases/${applicationId}/evidence/have-evidence-of-capital`);
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Do you have evidence of your client's capital?",
      );
    });

    it("renders two radio options", () => {
      const buttons = radioInput.properties.items as { text: string }[];
      expect(buttons.length).to.equal(2);
      expect(buttons[0].text).to.equal("Yes");
      expect(buttons[1].text).to.equal("No, evidence is not required");
    });
  });

  describe("POST /cases/evidence/have-evidence-of-capital", () => {
    const fieldCode = "haveEvidenceOfCapital";
    
    it("should show validation error if no option is selected", async () => {
      const result = await client.post(`/cases/${applicationId}/evidence/have-evidence-of-capital`);
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
      ).to.deep.equal("Please select an option to continue");
    });

    it("should redirect to have evidence of capital step if no is selected", async () => {
      const result = await client.post(`/cases/${applicationId}/evidence/have-evidence-of-capital`, {
        body: {
          haveEvidenceOfCapital: "no",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(`/cases/${applicationId}/evidence/check-answers`);
    });

    it("should redirect to evidence of capital step if yes is selected", async () => {
      const result = await client.post(`/cases/${applicationId}/evidence/have-evidence-of-capital`, {
        body: {
          haveEvidenceOfCapital: "yes",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        `/cases/${applicationId}/evidence/evidence-of-capital`,
      );
    });
  });
});
