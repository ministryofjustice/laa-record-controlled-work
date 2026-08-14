import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import {
  CreateApplicationEffects,
  createApplicationEffectsRegistry,
} from "#/journeys/create-application/create-application.effects.js";

import { declarationStep } from "#/journeys/create-application/steps/declaration.step.js";
import { ecfStep } from "#/journeys/create-application/steps/ecf.step.js";
import { createTestClient } from "../../utils/helpers.js";

describe("Declaration step", () => {
  const client = createTestClient({
    effects: [CreateApplicationEffects.loadDraftAnswers("testJourney")],
    path: "/cases/new/",
    steps: [
      declarationStep("testJourney"),
      ecfStep("testJourney"),
    ],
    testEffects: createApplicationEffectsRegistry,
  });

  describe("GET /cases/new/provider-declaration", () => {
    let renderResult: TestRenderResult;

    before(async () => {
      const result = await client.get("/cases/new/provider-declaration");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
    });

    it("sets the expected step title", () => {
      expect(renderResult.context.step.title).to.equal("Declaration");
    });

    it("renders a backlink to the start page", () => {
      const [backLink] = renderResult.getBlocksByVariant("govukBackLink");
      expect(backLink.properties.href).to.equal("/");
    });

    it("renders declaration body copy including the privacy policy link", () => {
      const body = renderResult
        .getBlocksByVariant("html")
        .find(
          (block) =>
            typeof block.properties.content === "string" &&
            block.properties.content.includes("By continuing, you agree that"),
        );
      expect(body).to.not.equal(undefined);
      const text = body?.properties.content as string;

      expect(text).to.include("By continuing, you agree that");
      expect(text).to.include('href="/privacy-policy"');
      expect(text).to.include(
        "LAA privacy policy (opens in a new window or tab)",
      );
    });

    it("renders an agree-and-continue button", () => {
      const [button] = renderResult.getBlocksByVariant("govukButton");
      expect(button.properties.text).to.equal("Agree and continue");
    });
  });

  describe("POST /cases/new/provider-declaration", () => {
    it("redirects to the ecf step", async () => {
      const result = await client.post("/cases/new/provider-declaration");

      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/ecf");
    });
  });
});
