import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { legalAidLast6MonthsStep } from "#/journeys/create-application/steps/3-legal-aid-last-6-months.step.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";

describe("Legal aid before 6 months step", () => {
  const client = createForgeTestClient(legalAidLast6MonthsStep("testJourney"));

  describe("GET /create-application/legal-aid-last-6-months", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get(
        "/create-application/legal-aid-last-6-months",
      );
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Did your client get legal help for this matter in the last 6 months?",
      );
    });

    it("renders two radio options", () => {
      const buttons = radioInput.properties.items as { text: string }[];
      expect(buttons.length).to.equal(2);
      expect(buttons[0].text).to.equal("Yes");
      expect(buttons[1].text).to.equal("No");
    });
  });

  describe("POST /create-application/legal-aid-last-6-months", () => {
    const legalAidLast6MonthsfieldCode = "legalAidLast6Months";
    const reasonForYesFieldCode = "reasonForYes";

    it("should show validation error if no option is selected", async () => {
      const result = await client.post(
        "/create-application/legal-aid-last-6-months",
      );
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(legalAidLast6MonthsfieldCode)[0].message,
      ).to.deep.equal(
        "Select if your client got legal help for this matter in the last 6 months",
      );
    });

    it("should show validation error if yes is selected but no reason is given", async () => {
      const result = await client.post(
        "/create-application/legal-aid-last-6-months",
        {
          body: { legalAidLast6Months: "yes" },
        },
      );
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(reasonForYesFieldCode)[0].message,
      ).to.deep.equal(
        "Enter the reason you're creating a new case for the same matter",
      );
    });

    it("should redirect to legal aid last 6 months step if yes", async () => {
      const result = await client.post(
        "/create-application/legal-aid-last-6-months",
        {
          body: {
            legalAidLast6Months: "yes",
            reasonForYes: "Some reason",
          },
        },
      );
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/create-application/client-details");
    });

    it("should redirect to client details step if no, different matter", async () => {
      const result = await client.post(
        "/create-application/legal-aid-last-6-months",
        {
          body: {
            legalAidLast6Months: "no",
          },
        },
      );
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/create-application/client-details");
    });
  });
});
