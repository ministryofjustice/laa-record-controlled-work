import {
  TestResult,
  TestRenderResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { expect } from "chai";
import { legalAidBefore6MonthsStep } from "#/journeys/create-application/steps/3-legal-aid-within-6-months.step.js";
import { createStepClient } from "../../utils/helpers.js";

describe("Legal aid before 6 months step", () => {
  const client = createStepClient(legalAidBefore6MonthsStep("testJourney"));

  describe("GET /create-application/legal-aid-last-6-months", () => {
    let result: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const res = await client.get(
        "/create-application/legal-aid-last-6-months",
      );
      expect(res.type).to.equal("render");
      result = res as TestRenderResult;
      [radioInput] = result.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(result.context.step.title).to.equal(
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

  it("should show validation error if no option is selected", async () => {
    const result = await client.post(
      "/create-application/legal-aid-last-6-months",
    );
    expect(result.type).to.equal("render");
    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);
      expect(result.context.fieldValidationErrors[0].message).to.deep.equal(
        "Select if your client got legal help for this matter in the last 6 months",
      );
    }
  });

  it("should show validation error if yes is selected but no reason is given", async () => {
    const result = await client.post(
      "/create-application/legal-aid-last-6-months",
      {
        body: { legalAidLast6Months: "yes" },
      },
    );
    expect(result.type).to.equal("render");
    if (result.type === "render") {
      expect(result.context.showValidationFailures).to.equal(true);
      expect(result.context.fieldValidationErrors[0].message).to.deep.equal(
        "Enter the reason you’re creating a new case for the same matter",
      );
    }
  });

  it("should redirect to legal aid last 6 months step if yes", async () => {
    const result: TestResult = await client.post(
      "/create-application/legal-aid-last-6-months",
      {
        body: {
          legalAidLast6Months: "yes",
          reasonForYes: "Some reason",
        },
      },
    );
    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/client-details");
    }
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
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/client-details");
    }
  });
});
