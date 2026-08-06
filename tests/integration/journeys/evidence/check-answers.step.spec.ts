import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { checkAnswersStep } from "#/journeys/evidence/steps/check-answers/check-answers.step.js";

describe("Check answers step", () => {
  const client = createForgeTestClient(
    "Evidence",
    "/cases/evidence",
    [checkAnswersStep("testJourney")],
  );
  const session = {
    journeyDrafts: {
      testJourney: {
        doYouHaveEvidence: "yes",
        employedEvidence: ["wageSlips"],
        selfEmployedEvidence: [],
        benefitsInKindEvidence: [],
        otherEvidence: [],
        stateBenefitsEvidence: [],
        asylumSupportEvidence: [],
        taxCreditsEvidence: [],
        incomeEvidence: ["wageSlips", "taxCalculationSheet"],
        housingCostsEvidence: [],
        capitalEvidence: ["bankStatementCapital", "shareCertificate"],
      },
    },
  };

  describe("GET /cases/evidence/check-answers", () => {
    let renderResult: TestRenderResult;
    let summaryList: RenderBlock;
    let submitButton: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/evidence/check-answers", {
        session,
      });
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [summaryList] = renderResult.getBlocksByVariant("govukSummaryList");
      [submitButton] = renderResult.getBlocksByVariant("govukButton");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal("Check your answers");
    });

    it("renders a summary list", () => {
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
      }>;
      expect(rows.length).to.equal(5);
      expect(rows[0].key.text).to.equal("Do you have evidence?");
      expect(rows[2].key.text).to.equal("Income");
      expect(rows[3].key.text).to.equal("Expenditure");
      expect(rows[4].key.text).to.equal("Capital");
    });

    it("renders the evidence list when do you have evidence is 'yes'", () => {
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
      }>;
      const evidenceRow = rows.find(
        (row) => row.key.text === "Income",
      );

      expect(evidenceRow).to.not.be.undefined;
    });

    it("renders the evidence in the correct format", () => {
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
        value: { html: string };
      }>;
      const evidenceRow = rows.find((row) => row.key.text === "Income");

      expect(evidenceRow?.value.html).to.contain(
        "<strong>Employed (PAYE) income:</strong>",
      );
    });

    it("renders the submit button", () => {
      expect(submitButton.properties.text).to.equal("Save and continue");
    });
  });

  describe("POST /cases/evidence/check-answers", () => {
    it("redirects to the confirmation step", async () => {
      const result = await client.post("/cases/evidence/check-answers", {
        session,
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/task-list");
    });
  });
});
