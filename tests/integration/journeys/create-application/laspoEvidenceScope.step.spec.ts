import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";
import { createApplicationTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";

describe("LASPO Evidence Scope step", () => {
  const client = createApplicationTestClient(
    createApplicationJourney,
    createApplicationEffectsRegistry,
  );

  describe("GET /cases/new/prove-in-scope", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/new/prove-in-scope");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "How can you prove this case is in scope?",
      );
    });

    it("renders all radio options", () => {
      const buttons = radioInput.properties.items as { text: string, value: string }[];
      expect(buttons.length).to.equal(5);
      expect(buttons).to.have.deep.include.members([
        { text: "Evidence of domestic abuse (Schedule 1)", value: "domesticAbuse" },
        { text: "Evidence of child abuse (Schedule 2)", value: "childAbuse" },
        { text: "Client is under 18 at time of signing", value: "under18" },
        { text: "Client is a parent, person with parental responsibility, or prospective special guardian involved in a Special Guardianship Order application", value: "parentOrGuardian" },
        { text: "None of these", value: "none" },
      ]);
    });
  });

  describe("POST /cases/new/prove-in-scope", () => {
    const fieldCode = "laspoEvidenceScope";

    it("should show validation error if no option is selected", async () => {
      const result = await client.post("/cases/new/prove-in-scope");
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
      ).to.deep.equal("Select how can you prove this case is in scope");
    });

    // TODO: Update when next step is added
    it("should redirect to legal aid before step if an option is selected", async () => {
      const result = await client.post("/cases/new/prove-in-scope", {
        body: {
          laspoEvidenceScope: "domesticAbuse",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/legal-aid-before");
    });

    // TODO: Update when next step is added
    it("should redirect to legal aid before step if none is selected", async () => {
      const result = await client.post("/cases/new/prove-in-scope", {
        body: {
          laspoEvidenceScope: "none",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/legal-aid-before");
    });
  });
});
