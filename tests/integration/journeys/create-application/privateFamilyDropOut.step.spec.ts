import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";
import { createApplicationTestClient } from "../../utils/helpers.js";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";

describe("Private Family Drop Out step", () => {
  const stepUrl = "/cases/new/not-in-scope";

  const client = createApplicationTestClient(
    createApplicationJourney,
    createApplicationEffectsRegistry,
  );

  describe(`GET ${stepUrl}`, () => {
    let renderResult: TestRenderResult;

    before(async () => {
      const result = await client.get(stepUrl);
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "This case is not in scope for legal aid",
      );
    });
  });

  describe(`POST ${stepUrl}`, () => {

    it("should redirect to case list when finish button is clicked", async () => {
      const result = await client.post(stepUrl);
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases");
    });
  });
});
