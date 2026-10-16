import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";
import { createApplicationTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";
import { AnswerKey } from "#/journeys/AnswerKey.enum.js";

describe("Letter from Local Authority step", () => {
  const stepUrl = "/cases/new/care-proceedings";

  const client = createApplicationTestClient(
    createApplicationJourney,
    createApplicationEffectsRegistry,
  );

  describe(`GET ${stepUrl}`, () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get(stepUrl);
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the expected title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Has your client received a letter saying the local authority is initiating care proceedings?",
      );
    });

    it("renders the expected radio options", () => {
      const buttons = radioInput.properties.items as {
        text: string;
        value: string;
      }[];

      expect(buttons).to.have.lengthOf(2);
      expect(buttons).to.deep.include.members([
        { text: "Yes", value: "yes" },
        { text: "No", value: "no" },
      ]);
    });
  });

  describe(`POST ${stepUrl}`, () => {
    it("shows validation error if no option is selected", async () => {
      const result = (await client.post(stepUrl)) as TestRenderResult;
      // Map complex validation error objects to just message strings for clearer assertion.
      const errorMessages = result
        .getValidationErrorsByFieldCode(AnswerKey.letterFromLocalAuthority)
        .map((item) => item.message);

      expect(errorMessages).to.include(
        "Select if your client received a letter saying the local authority is initiating care proceedings",
      );
    });

    // TODO MEM-1051 Enable this test when adding the Parental Responsibility step.
    it.skip("redirects to the Parental Responsibility step when answer is 'Yes'", async () => {
      const result = (await client.post(stepUrl, {
        body: {
          [AnswerKey.letterFromLocalAuthority]: "yes",
        },
      })) as TestRedirectResult;

      expect(result.type).to.equal("redirect");
      expect(result.url).to.equal("/cases/new/parental-responsibility");
    });

    // TODO MEM-1055 Enable this test when adding the Confirm Merits step.
    it.skip("redirects to Confirm Merits step when answer is 'No'", async () => {
      const result = (await client.post("/cases/new/ecf", {
        body: {
          [AnswerKey.letterFromLocalAuthority]: "no",
        },
      })) as TestRedirectResult;

      expect(result.type).to.equal("redirect");
      expect(result.url).to.equal("/cases/new/confirm-merits");
    });

    it("returns to the Check Answers step when edited", async () => {
      const result = (await client.post(stepUrl, {
        query: { returnTo: "check-answers" },
        body: {
          [AnswerKey.letterFromLocalAuthority]: "no",
        },
      })) as TestRedirectResult;

      expect(result.url).to.equal("/cases/new/check-answers");
    });
  });
});
