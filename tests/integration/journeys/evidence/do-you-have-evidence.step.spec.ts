import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { doYouHaveEvidence } from "#/journeys/evidence/steps/do-you-have-evidence/do-you-have-evidence.step.js";
import { createTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import { evidencePackage } from "#/journeys/evidence/evidence.package.js";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";
import { evidenceJourney } from "#/journeys/evidence/evidence.journey.js";

describe("Do you have evidence step", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";
  const client = createTestClient({
    accessHooks: evidenceJourney.onAccess,
    journeyCode: "evidence",
    path: "/cases/:applicationID/evidence",
    steps: [doYouHaveEvidence("evidence")],
    testEffects: evidencePackage.functions,
  });

  describe("GET /cases/evidence/have-evidence", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get(`/cases/${applicationId}/evidence/have-evidence`);
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
      const result = await client.post(`/cases/${applicationId}/evidence/have-evidence`);
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
      ).to.deep.equal("Please select an option to continue");
    });

    it("should redirect to reason for no evidence step if no is selected", async () => {
      const result = await client.post(`/cases/${applicationId}/evidence/have-evidence`, {
        body: {
          doYouHaveEvidence: "no",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(`/cases/${applicationId}/evidence/reason-for-no-evidence`);
    });

    it("should redirect to evidence of income step if yes is selected", async () => {
      const result = await client.post(`/cases/${applicationId}/evidence/have-evidence`, {
        body: {
          doYouHaveEvidence: "yes",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        `/cases/${applicationId}/evidence/evidence-of-income`,
      );
    });
  });
});
