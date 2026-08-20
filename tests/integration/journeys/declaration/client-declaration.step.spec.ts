import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";

import { createForgeTestClient } from "../../utils/helpers.js";
import { TemplateWrapper } from "@ministryofjustice/hmpps-forge/core/components";
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
        .getBlocksByVariant("html")
        .find(
          (block) =>
            typeof block.properties.content === "string" &&
            block.properties.content.includes("Joe Bloggs agrees that:"),
        );
      expect(body).to.not.equal(undefined);
      const text = body?.properties.content as string;

      expect(text).to.include("they've read the");
      expect(text).to.include(
        "LAA privacy policy (opens in a new window or tab)",
      );
    });

    it("renders a Confirm and Continue button", () => {
      const buttonGroup = renderResult.getBlocksByVariant(
        "templateWrapper",
      )[0] as unknown as TemplateWrapper;
      // @ts-ignore-next-line
      const continueButton = buttonGroup.properties.slots.child0[0];
      expect(continueButton).to.exist;
      expect(continueButton.properties.value).to.equal("continue");
    });

    it("renders a Save and Return button", () => {
      const buttonGroup = renderResult.getBlocksByVariant(
        "templateWrapper",
      )[0] as unknown as TemplateWrapper;
      // @ts-ignore-next-line
      const returnButton = buttonGroup.properties.slots.child1[0];
      expect(returnButton).to.exist;
      expect(returnButton.properties.value).to.equal("return");
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
