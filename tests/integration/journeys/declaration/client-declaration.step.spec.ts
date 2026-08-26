import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";

import { createForgeTestClient } from "../../utils/helpers.js";
import { getBlockWithContent } from "../../utils/getBlockWithContent.helper.js";
import { DeclarationJourney } from "#/journeys/declaration/declaration.journey.js";
import sinon from "sinon";
import { declarationEffectRegistry } from "#/journeys/declaration/declaration.effects.js";

describe("Declaration step", () => {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";

  const updateApplicationDeclarationMock = sinon.stub().resolves({
    status: 204,
  });

  const client = createForgeTestClient(
    DeclarationJourney,
    declarationEffectRegistry,
    {
      dependencies: {
        updateApplicationDeclaration: updateApplicationDeclarationMock,
      },
    },
  );

  describe(`GET /cases/${uuid}/declaration/confirm`, () => {
    let renderResult: TestRenderResult;

    before(async () => {
      const result = await client.get(`/cases/${uuid}/declaration/confirm`);
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
    });

    it("sets the expected step title", () => {
      expect(renderResult.context.step.title).to.equal("Confirm the following");
    });

    it("renders a backlink to the start page", () => {
      const [backLink] = renderResult.getBlocksByVariant("govukBackLink");
      expect(backLink.properties.href).to.equal(`/cases/${uuid}/task-list/`);
    });

    it("renders declaration body copy including the privacy policy link", () => {
      const body = renderResult
        .getBlocksByVariant("govukBody")
        .find(
          (block) =>
            typeof block.properties.text === "string" &&
            block.properties.text.includes("Joe Bloggs agrees that:"),
        );
      expect(body).to.not.equal(undefined);
      const text = body?.properties.text as string;

      expect(text).to.include("they've read the");
      expect(text).to.include(
        "LAA privacy policy (opens in a new window or tab)",
      );
    });

    it("renders a Confirm and Continue button", () => {
      const block = getBlockWithContent(renderResult, "govukButtonGroup", "continue");
      expect(block).to.exist;
    });

    it("renders a Save and Return button", () => {
      const block = getBlockWithContent(renderResult, "govukButtonGroup", "return");
      expect(block).to.exist;
    });
  });

  describe(`POST /cases/${uuid}/declaration/confirm`, () => {
    it("redirects to the application summary step when continue is clicked", async () => {
      const result = await client.post(`/cases/${uuid}/declaration/confirm`, {
        body: {
          action: "continue",
        },
      });

      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(`/cases/${uuid}/declaration/sign`);
    });

    it("redirects to the task list step when return is clicked", async () => {
      const result = await client.post(`/cases/${uuid}/declaration/confirm`, {
        body: {
          action: "return",
        },
      });

      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(`/cases/${uuid}/task-list/`);
    });
  });
});
