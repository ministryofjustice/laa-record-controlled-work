import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createTestClient } from "../../utils/helpers.js";
import { evidenceOfExpenditure } from "#/journeys/evidence/steps/evidence-of-expenditure/evidence-of-expenditure.step.js";
import { evidenceEffects } from "#/journeys/evidence/evidence.effects.js";
import { evidencePackage } from "#/journeys/evidence/evidence.package.js";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";
import { evidenceJourney } from "#/journeys/evidence/evidence.journey.js";

describe("Evidence of expenditure step", () => {
  const applicationId = "123e4567-e89b-12d3-a456-426614174000";
  const client = createTestClient({
    accessHooks: evidenceJourney.onAccess,
    journeyCode: "evidence",
    path: "/cases/:applicationID/evidence",
    steps: [evidenceOfExpenditure("evidence")],
    testEffects: evidencePackage.functions,
  });

  describe("GET /cases/evidence/evidence-of-expenditure", () => {
    let renderResult: TestRenderResult;
    let checkboxInputs: RenderBlock[];

    before(async () => {
      const result = await client.get(
        `/cases/${applicationId}/evidence/evidence-of-expenditure`,
      );
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      checkboxInputs = renderResult.getBlocksByVariant("govukCheckboxInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Evidence of your client's expenditure",
      );
    });

    it("renders 10 checkbox options", () => {
      const buttons = checkboxInputs
        .map((checkbox) =>
          (checkbox.properties as any).items.map(
            (item: { text: any }) => item.text,
          ),
        )
        .flat();

      expect(buttons.length).to.equal(10);
      expect(buttons[0]).to.equal("Wage slips");
      expect(buttons[1]).to.equal("Tax calculation sheet form SA302");
      expect(buttons[2]).to.equal("Bank statement");
      expect(buttons[3]).to.equal("Mortgage statement");
      expect(buttons[4]).to.equal("Rent book or tenancy agreement");
      expect(buttons[5]).to.equal("Bank statement");
      expect(buttons[6]).to.equal("Agreement or contract");
      expect(buttons[7]).to.equal("Bank statement");
      expect(buttons[8]).to.equal("Maintenance order");
      expect(buttons[9]).to.equal("Receipts");
    });
  });

  describe("POST /cases/evidence/evidence-of-expenditure", () => {
    it("should redirect to evidence of expenditure and capital step if at least one option is selected", async () => {
      const result = await client.post(
        `/cases/${applicationId}/evidence/evidence-of-expenditure`,
        {
          body: {
            employedEvidence: ["wageSlips", "taxCalculationSheet"],
          },
        },
      );
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        `/cases/${applicationId}/evidence/evidence-of-capital`,
      );
    });
  });
});
