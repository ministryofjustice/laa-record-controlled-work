import { createForgeTestClient } from "#tests/integration/utils/helpers.js";
import { faker } from "@faker-js/faker";
import {
  TestRedirectResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { declarationEffectRegistry } from "#/journeys/declaration/declaration.effects.js";
import { DeclarationJourney } from "#/journeys/declaration/declaration.journey.js";
import sinon from "sinon";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";

describe("Check answers step", () => {
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

  const session = {
    journeyDrafts: {
      declaration: {
        declarationUfn: "123456",
        declarationSignedDate: "2024-06-01",
        declarationSignedConfirm: "true",
      },
    },
  };

  describe(`GET /cases/:applicationId/declaration/check-answers`, () => {
    let renderResult: TestRenderResult;
    let summaryList: RenderBlock;
    let submitButton: RenderBlock;

    before(async () => {
      const result = await client.get(
        `/cases/${uuid}/declaration/check-answers`,
        {
          session,
        },
      );
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [summaryList] = renderResult.getBlocksByVariant("govukSummaryList");
      [submitButton] = renderResult.getBlocksByVariant("govukButton");
    });

    it("has the expected step title", () => {
      expect(renderResult.context.step.title).to.equal("Check your answers");
    });

    it("renders a summary list", () => {
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
      }>;
      expect(rows.length).to.equal(2);
      expect(rows[0].key.text).to.equal("Date of signature");
      expect(rows[1].key.text).to.equal("UFN");
    });

    it("renders the evidence in the correct format", () => {
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
        value: { text: string };
      }>;
      const evidenceRow = rows.find(
        (row) => row.key.text === "Date of signature",
      );

      expect(evidenceRow?.value.text).to.contain("1 June 2024");
    });

    it("renders the submit button", () => {
      expect(submitButton.properties.text).to.equal("Save and continue");
    });
  });

  describe("POST /cases/:applicationId/declaration/check-answers", () => {
    it("redirects to the confirmation step", async () => {
      const result = await client.post(
        `/cases/${uuid}/declaration/check-answers`,
        {
          session,
        },
      );
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(`/cases/${uuid}/task-list`);
    });
  });
});
