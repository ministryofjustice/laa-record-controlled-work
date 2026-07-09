import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { reasonForNoEvidence } from "#/journeys/evidence/steps/reason-for-no-evidence/reason-for-no-evidence.step.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";

describe("Reason for no evidence step", () => {
  const client = createForgeTestClient(
    "Evidence",
    "/cases/evidence",
    reasonForNoEvidence("testJourney"),
  );

  describe("GET /cases/evidence/reason-for-no-evidence", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;
    let textareaInput: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/evidence/reason-for-no-evidence");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
      [textareaInput] = renderResult.getBlocksByVariant("govukCharacterCount");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "What's the reason for not having evidence?",
      );
    });

    it("renders three radio options", () => {
      const buttons = radioInput.properties.items as { text: string }[];
      expect(buttons.length).to.equal(3);
      expect(buttons[0].text).to.equal(
        "It's not possible to get it before starting the work",
      );
      expect(buttons[1].text).to.equal(
        "Advice is being given over the phone before the case is signed",
      );
      expect(buttons[2].text).to.equal(
        "The personal circumstances of the client make it not possible to get evidence at any point in the case",
      );
    });

    it("renders a textarea input", () => {
      expect(textareaInput).to.exist;
      expect(textareaInput.properties.code).to.equal("moreDetailsForNoEvidence");
    });
  });

  describe("POST /cases/evidence/reason-for-no-evidence", () => {
    const fieldCodeRadio = "reasonForNoEvidence";
    const fieldCodeTextarea = "moreDetailsForNoEvidence";

    it("should show validation error if no option is selected", async () => {
      const result = await client.post(
        "/cases/evidence/reason-for-no-evidence",
        {
          body: {
            moreDetailsForNoEvidence: "a reason",
          },
        },
      );
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCodeRadio)[0].message,
      ).to.deep.equal("You must select a reason for not having evidence");
    });

    it("should show validation error if no reason is given", async () => {
      const result = await client.post(
        "/cases/evidence/reason-for-no-evidence",
        {
          body: {
            reasonForNoEvidence: "notPossibleBeforeStart",
          },
        },
      );
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCodeTextarea)[0].message,
      ).to.deep.equal("You must provide details for not having evidence");
    });

    it("should redirect to check answers step if not possible before start is selected", async () => {
      const result = await client.post(
        "/cases/evidence/reason-for-no-evidence",
        {
          body: {
            reasonForNoEvidence: "notPossibleBeforeStart",
            moreDetailsForNoEvidence: "a reason",
          },
        },
      );
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/evidence/check-your-answers");
    });

    it("should redirect to check answers step if personal circumstances is selected", async () => {
      const result = await client.post(
        "/cases/evidence/reason-for-no-evidence",
        {
          body: {
            reasonForNoEvidence: "personalCircumstances",
            moreDetailsForNoEvidence: "a reason",
          },
        },
      );
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/evidence/check-your-answers");
    });

    it("should redirect to check answers step if advice over phone is selected", async () => {
      const result = await client.post(
        "/cases/evidence/reason-for-no-evidence",
        {
          body: {
            reasonForNoEvidence: "adviceOverPhone",
            moreDetailsForNoEvidence: "a reason",
          },
        },
      );
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/evidence/check-your-answers");
    });
  });
});
