import { initForgeTestClient } from "#tests/integration/utils/helpers.js";
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

describe("Declaration sign step", () => {
  const uuid = faker.string.uuid();

  const updateApplicationDeclarationMock = sinon.stub().resolves({
    status: 204,
  });

  const client = initForgeTestClient(
    DeclarationJourney,
    declarationEffectRegistry,
    { updateApplicationDeclaration: updateApplicationDeclarationMock },
  );

  describe(`GET /cases/:applicationId/declaration/sign`, () => {
    let render: TestRenderResult;

    before(async () => {
      const result = await client.get(`/cases/${uuid}/declaration/sign`);
      render = result as TestRenderResult;
    });

    it("renders", () => {
      expect(render.type).to.equal("render");
    });

    it("has the expected step title", () => {
      expect(render.context.step.title).to.equal("Sign the declaration");
    });

    it("shows the expected backlink", () => {
      const block = render.getBlocksByVariant("govukBackLink")[0];

      expect(block).to.exist;
      expect(block.properties.href).to.equal(
        `/cases/${uuid}/declaration/confirm`,
      );
    });

    it("shows the expected caption", () => {
      const content = "Client declaration";
      const block = getBlockWithContent(render, "html", content);

      expect(block).to.exist;
    });

    it("shows the expected page heading", () => {
      const block = getBlockWithContent(render, "html", "Sign the declaration");

      expect(block).to.exist;
      expect(block.properties.tag).to.equal("h1");
    });

    [
      "Download a copy of the details you entered for your client and get them to sign the declaration.",
      "You must save a copy along with any evidence provided by your client. Your client’s file may be audited and assessed by the LAA at a later date.",
    ].forEach((paragraph, index) => {
      it(`shows the expected statement (${index})`, () => {
        const block = getBlockWithContent(render, "html", paragraph);
        expect(block).to.exist;
      });
    });

    it("shows the expected PDF download button", () => {
      const block = getBlockWithContent(
        render,
        "govukButton",
        "Download declaration as a PDF",
      );

      expect(block).to.exist;
      expect(block.properties.value).to.equal("download-pdf");
    });

    it("shows the expected confirmation heading", () => {
      const block = getBlockWithContent(
        render,
        "html",
        "Confirmation of signed declaration",
      );

      expect(block).to.exist;
      expect(block.properties.tag).to.equal("h2");
    });

    // TODO Can this be refactored to use `getBlockWithContent`?
    it("shows the expected checkbox", () => {
      const label = "I confirm that I have a signed declaration from my client";
      const value = "yes";

      const blocks = render.getBlocksByVariant("govukCheckboxInput");
      const block = blocks.find((block) => {
        const items = block.properties?.items as Record<string, string>[];
        return items && items[0].text === label && items[0].value === value;
      });

      expect(block).to.exist;
    });

    it("shows the expected date field", () => {
      const block = getBlockWithContent(
        render,
        "govukDateInputFull",
        "Date of signature",
      );
      expect(block).to.exist;
      expect(block.properties.hint).to.equal(
        "This is your case start date and the date you can bill from",
      );
    });

    it("shows the expected 'continue' button", () => {
      const block = getBlockWithContent(render, "templateWrapper", "Continue");
      expect(block).to.exist;
      expect(block.variant).to.equal("govukButton");
      expect(block.properties.value).to.equal("continue");
    });

    it("shows the expected 'save and return later' button", () => {
      const block = getBlockWithContent(
        render,
        "templateWrapper",
        "Save and return later",
      );
      expect(block).to.exist;
      expect(block.variant).to.equal("govukButton");
      expect(block.properties.value).to.equal("return");
    });
  });

  describe(`POST /cases/:applicationId/declaration/sign`, () => {
    const uuid = faker.string.uuid();

    it("redirects to the UFN step when 'continue' is clicked", async () => {
      const result = (await client.post(`/cases/${uuid}/declaration/sign`, {
        body: {
          action: "continue",
          declarationSignedConfirm: ["yes"],
          declarationSignedDate: { year: "2000", month: "2", day: "2" },
        },
      })) as TestRedirectResult;

      expect(result.type).to.equal("redirect");
      expect(result.url).to.equal(`/cases/${uuid}/declaration/ufn`);
    });

    it("redirects to the declaration confirm step when 'save and return later' is clicked", async () => {
      const result = (await client.post(`/cases/${uuid}/declaration/sign`, {
        body: {
          action: "return",
        },
      })) as TestRedirectResult;

      expect(result.type).to.equal("redirect");
      expect(result.url).to.equal(`/cases/${uuid}/declaration/confirm`);
    });
  });
});
