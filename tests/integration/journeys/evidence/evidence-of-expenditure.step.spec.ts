import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createForgeTestClient } from "../../utils/helpers.js";
import { evidenceOfExpenditure } from "#/journeys/evidence/steps/evidence-of-expenditure/evidence-of-expenditure.step.js";

describe("Evidence of expenditure step", () => {
  const client = createForgeTestClient(
    "Evidence",
    "/cases/evidence",
    evidenceOfExpenditure("testJourney"),
  );

  describe("GET /cases/evidence/evidence-of-expenditure", () => {
    let renderResult: TestRenderResult;
    let checkboxInputs: RenderBlock[];

    before(async () => {
      const result = await client.get(
        "/cases/evidence/evidence-of-expenditure",
      );
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      checkboxInputs = renderResult.getBlocksByVariant("govukCheckboxInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Evidence of your client’s expenditure",
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
        "/cases/evidence/evidence-of-expenditure",
        {
          body: {
            employedEvidence: ["wageSlips", "taxCalculationSheet"],
          },
        },
      );
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        "/cases/evidence/evidence-of-capital",
      );
    });
  });
});
