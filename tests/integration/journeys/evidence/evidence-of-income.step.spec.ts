import { evidenceOfIncome } from "#/journeys/evidence/steps/evidence-of-income/evidence-of-income.step.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { TestRedirectResult, TestRenderResult } from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createForgeTestClient } from "../../utils/helpers.js";

describe("Evidence of income step", () => {
  const client = createForgeTestClient(
    "Evidence",
    "/cases/evidence",
    evidenceOfIncome("testJourney"),
  );

  describe("GET /cases/evidence/evidence-of-income", () => {
    let renderResult: TestRenderResult;
    let checkboxInputs: RenderBlock[];

    before(async () => {
      const result = await client.get("/cases/evidence/evidence-of-income");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      checkboxInputs = renderResult.getBlocksByVariant("govukCheckboxInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Do you have evidence of your client's income?",
      );
    });

    it("renders 18 checkbox options", () => {
      const buttons = checkboxInputs.map((checkbox) => (checkbox.properties as any).items.map((item: { text: any; }) => item.text)).flat();

      expect(buttons.length).to.equal(18);
        expect(buttons[0]).to.equal("Wage slips");
        expect(buttons[1]).to.equal("Bank statements");
        expect(buttons[2]).to.equal("Complete financial accounts");
        expect(buttons[3]).to.equal("Self Assessment tax return");
        expect(buttons[4]).to.equal("Cash book");
        expect(buttons[5]).to.equal("P11D tax form");
        expect(buttons[6]).to.equal("Evidence of rental income");
        expect(buttons[7]).to.equal("Evidence of trust income");
        expect(buttons[8]).to.equal("Letter from friend or family providing support");
        expect(buttons[9]).to.equal("Pension documents");
        expect(buttons[10]).to.equal("Student loan letter");
        expect(buttons[11]).to.equal("Other");
        expect(buttons[12]).to.equal("Latest letter showing change in benefit amount");
        expect(buttons[13]).to.equal("Letter from the paying agency that shows the client is receiving the passporting benefit");
        expect(buttons[14]).to.equal("Original notification letter");
        expect(buttons[15]).to.equal("Letter from asylum support or the local authority that shows the client is receiving support");
        expect(buttons[16]).to.equal("Latest tax credit award notice");
        expect(buttons[17]).to.equal("Other recent HMRC letter confirming the amount received");
    });
  });

    describe("POST /cases/evidence/evidence-of-income", () => {

    it("should show validation error if no option is selected", async () => {
      const result = await client.post("/cases/evidence/evidence-of-income");
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
    });

    it("should redirect to evidence of expenditure and capital step if at least one option is selected", async () => {
        const result = await client.post("/cases/evidence/evidence-of-income", {
            body: {
                incomeEvidenceTypes: ["wageSlips", "bankStatements"],
            },
        });
        expect(result.type).to.equal("redirect");
        const redirectResult = result as TestRedirectResult;
        expect(redirectResult.url).to.equal("/cases/evidence/evidence-of-expenditure-and-capital");
    });
  });

});
