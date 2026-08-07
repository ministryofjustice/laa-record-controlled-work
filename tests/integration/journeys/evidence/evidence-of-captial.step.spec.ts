import { evidenceOfCapital } from "#/journeys/evidence/steps/evidence-of-capital/evidence-of-capital.step.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createForgeTestClient } from "../../utils/helpers.js";

describe("Evidence of capital step", () => {
  const client = createForgeTestClient(
    "Evidence",
    "/cases/evidence",
    [evidenceOfCapital("testJourney")],
  );

  describe("GET /cases/evidence/evidence-of-capital", () => {
    let renderResult: TestRenderResult;
    let checkboxInputs: RenderBlock[];

    before(async () => {
      const result = await client.get("/cases/evidence/evidence-of-capital");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      checkboxInputs = renderResult.getBlocksByVariant("govukCheckboxInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Evidence of your client's capital",
      );
    });

    it("renders 4 checkbox options", () => {
      const buttons = checkboxInputs
        .map((checkbox) =>
          (checkbox.properties as any).items.map(
            (item: { text: any }) => item.text,
          ),
        )
        .flat();

      expect(buttons.length).to.equal(4);
      expect(buttons[0]).to.equal("Bank statement");
      expect(buttons[1]).to.equal("National savings certificate or passbook");
      expect(buttons[2]).to.equal("Premium bonds statement");
      expect(buttons[3]).to.equal("Share certificate");
    });
  });

  describe("POST /cases/evidence/evidence-of-capital", () => {
    it("should show validation error if no option is selected", async () => {
      const result = await client.post("/cases/evidence/evidence-of-capital", {
        body: {},
      });
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
    });

    it("should redirect to check answers step", async () => {
      const result = await client.post("/cases/evidence/evidence-of-capital", {
        body: {
          capitalEvidence: ["bankStatement"],
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        "/cases/evidence/check-answers",
      );
    });
  });
});
