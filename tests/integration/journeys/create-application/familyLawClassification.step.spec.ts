import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";
import { createApplicationTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";

describe("Family law classification step", () => {
  const client = createApplicationTestClient(
    createApplicationJourney,
    createApplicationEffectsRegistry,
  );

  describe("GET /cases/new/family-type-of-case", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/new/family-type-of-case");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "What type of family law is it?",
      );
    });

    it("renders two radio options", () => {
      const buttons = radioInput.properties.items as { text: string }[];
      expect(buttons.length).to.equal(2);
      expect(buttons[0].text).to.equal("Private");
      expect(buttons[1].text).to.equal("Public");
    });
  });

  describe("POST /cases/new/family-type-of-case", () => {
    const fieldCode = "familyLawClassification";

    it("should show validation error if no option is selected", async () => {
      const result = await client.post("/cases/new/family-type-of-case");
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
      ).to.deep.equal("Please select an option");
    });

    it("should redirect to family private non means step if private", async () => {
      const result = await client.post("/cases/new/family-type-of-case", {
        body: {
          familyLawClassification: "private",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/family-private-non-means-question");
    });

    // TODO: uncomment when steps are added

    // it("should redirect to family public written notice step if public", async () => {
    //   const result = await client.post("/cases/new/family-type-of-case", {
    //     body: {
    //       familyLawClassification: "public",
    //     },
    //   });
    //   expect(result.type).to.equal("redirect");
    //   const redirectResult = result as TestRedirectResult;
    //   expect(redirectResult.url).to.equal("/cases/new/family-public-written-notice");
    // });
  });
});
