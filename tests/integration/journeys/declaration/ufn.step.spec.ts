import { createForgeTestClient } from "#tests/integration/utils/helpers.js";
import { faker } from "@faker-js/faker";
import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { declarationEffectRegistry } from "#/journeys/declaration/declaration.effects.js";
import { DeclarationJourney } from "#/journeys/declaration/declaration.journey.js";
import { getBlockWithContent } from "#tests/integration/utils/getBlockWithContent.helper.js";
import sinon from "sinon";

describe("Declaration UFN step", () => {
  const uuid = faker.string.uuid();

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

  describe(`GET /cases/:applicationId/declaration/ufn`, () => {
    let render: TestRenderResult;

    before(async () => {
      const result = await client.get(`/cases/${uuid}/declaration/ufn`);
      render = result as TestRenderResult;
      console.error(render.context.blocks[1])
    });

    it("renders", () => {
      expect(render.type).to.equal("render");
    });

    it("has the expected step title", () => {
      expect(render.context.step.title).to.equal("What is the unique file number (UFN) for this case?");
    });

    it("shows the expected caption", () => {
      const content = "Client declaration";
      const block = getBlockWithContent(render, "html", content);

      expect(block).to.exist;
    });

    it("shows the expected UFN field", () => {
      const block = getBlockWithContent(
        render,
        "govukTextInput",
        "What is the unique file number (UFN) for this case?",
      );
      expect(block).to.exist;
      expect((block.properties.hint as { text: string }).text).to.equal(
        "For example, 160726/001",
      );
    });

    it("shows the expected 'continue' button", () => {
      const block = getBlockWithContent(render, "govukButtonGroup", "continue");
      expect(block).to.exist;
    });

    it("shows the expected 'save and return later' button", () => {
      const block = getBlockWithContent(render, "govukButtonGroup", "return");
      expect(block).to.exist;
    });
  });

  describe(`POST /cases/:applicationId/declaration/ufn`, () => {
    const uuid = faker.string.uuid();

    it("redirects to the check answers step when 'continue' is clicked", async () => {
      const result = (await client.post(`/cases/${uuid}/declaration/ufn`, {
        body: {
          action: "continue",
          declarationUfn: ["123456"],
        },
      })) as TestRedirectResult;

      expect(result.type).to.equal("redirect");
      expect(result.url).to.equal(`/cases/${uuid}/declaration/check-answers`);
    });

    it("redirects to the task list when 'save and return later' is clicked", async () => {
      const result = (await client.post(`/cases/${uuid}/declaration/ufn`, {
        body: {
          action: "return",
        },
      })) as TestRedirectResult;

      expect(result.type).to.equal("redirect");
      expect(result.url).to.equal(`/cases/${uuid}/task-list`);
    });
  });
});
