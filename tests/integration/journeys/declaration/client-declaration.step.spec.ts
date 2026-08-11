import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";

import { clientConfirmationStep } from "#/journeys/declaration/steps/confirmation/client-confirmation.step.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { TemplateWrapper } from "@ministryofjustice/hmpps-forge/core/components";

describe("Declaration step", () => {
  const client = createForgeTestClient(
    "Declaration",
    "/cases/new/declaration/",
    [clientConfirmationStep()],
  );

  describe("GET /cases/new/declaration/client-declaration", () => {
    let renderResult: TestRenderResult;

    before(async () => {
      const result = await client.get(
        "/cases/new/declaration/client-declaration",
      );
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
    });

    it("sets the expected step title", () => {
      expect(renderResult.context.step.title).to.equal("Confirm the following");
    });

    it("renders a backlink to the start page", () => {
      const [backLink] = renderResult.getBlocksByVariant("govukBackLink");
      expect(backLink.properties.href).to.equal("/cases/new/task-list");
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
      const buttonGroup = renderResult.getBlocksByVariant("templateWrapper")[0] as unknown as TemplateWrapper;
      // @ts-ignore-next-line
      const continueButton = buttonGroup.properties.slots.child0[0];
      expect(continueButton).to.exist;
      expect(continueButton.properties.value).to.equal("continue");
    });

    it("renders a Save and Return button", () => {
      const buttonGroup = renderResult.getBlocksByVariant("templateWrapper")[0] as unknown as TemplateWrapper;
      // @ts-ignore-next-line
      const returnButton = buttonGroup.properties.slots.child1[0];
      expect(returnButton).to.exist;
      expect(returnButton.properties.value).to.equal("return");
    });
  });

  describe("POST /cases/new/declaration/client-declaration", () => {
    it("redirects to the application summary step when continue is clicked", async () => {
      const result = await client.post(
        "/cases/new/declaration/client-declaration",
        {
          body: {
            action: "continue",
          },
        },
      );

      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        "/cases/new/declaration/client-declaration-application-summary",
      );
    });

    it("redirects to the task list step when return is clicked", async () => {
      const result = await client.post(
        "/cases/new/declaration/client-declaration",
        {
          body: {
            action: "return",
          },
        },
      );

      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/task-list");
    });
  });
});
