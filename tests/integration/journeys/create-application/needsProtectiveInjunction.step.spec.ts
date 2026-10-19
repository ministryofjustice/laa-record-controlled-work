import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";
import { createApplicationTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";

describe("Needs protective injunction step", () => {
  const client = createApplicationTestClient(
    createApplicationJourney,
    createApplicationEffectsRegistry,
  );

  describe("GET /cases/new/protect-themself", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/new/protect-themself");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Does your client need legal aid to get a protective injunction order for themselves or their children?",
      );
    });

    it("renders two radio options", () => {
      const buttons = radioInput.properties.items as { text: string }[];
      expect(buttons.length).to.equal(2);
      expect(buttons[0].text).to.equal("Yes");
      expect(buttons[1].text).to.equal("No");
    });
  });

  describe("POST /cases/new/protect-themself", () => {
    const fieldCode = "needsProtectiveInjunction";

    it("should show validation error if no option is selected", async () => {
      const result = await client.post("/cases/new/protect-themself");
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
      ).to.deep.equal("Select whether your client needs legal aid to get a protective injunction order for themselves or their children.");
    });

    it("should redirect to legal aid before step if yes", async () => {
      const result = await client.post("/cases/new/protect-themself", {
        body: {
          needsProtectiveInjunction: "yes",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/legal-aid-before");
    });
  });
});
