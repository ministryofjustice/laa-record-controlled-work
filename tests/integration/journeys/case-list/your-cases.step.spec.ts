import {
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { yourCasesStep } from "#/journeys/your-cases/steps/your-cases/your-cases.step.js";
import { createForgeTestClientForCaseList } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";

describe("Your Cases step", () => {
  const client = createForgeTestClientForCaseList(
    yourCasesStep(),
  );

  describe("GET /your-cases", () => {
    let renderResult: TestRenderResult;
    let recordButton: RenderBlock;
    let table: RenderBlock;
    let subNavigation: RenderBlock;

    before(async () => {
      const result = await client.get("/your-cases");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [recordButton] = renderResult.getBlocksByVariant("govukLinkButton");
      [table] = renderResult.getBlocksByVariant("govukTable");
      [subNavigation] = renderResult.getBlocksByVariant("mojSubNavigation");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Your Cases",
      );
    });

    it("renders a link button", () => {
      expect(recordButton.properties.text).to.equal("Record a new case");
    });
    
    it("renders a sub navigation with the correct items", () => {
      const items = subNavigation.properties.items as { text: string; href: string; active?: boolean }[];
      expect(items[0].text).to.equal("In progress");
      expect(items[0].href).to.equal("/your-cases");
      expect(items[0].active).to.equal(true);
      expect(items[1].text).to.equal("Recorded");
      expect(items[1].href).to.equal("/your-cases-recorded");
    });

    it("renders a table with the correct columns", () => {
      const head = table.properties.head as { text: string }[];
      expect(head[0].text).to.equal("Client name");
      expect(head[1].text).to.equal("Reference number");
      expect(head[2].text).to.equal("Last updated");
    });
  });
});
