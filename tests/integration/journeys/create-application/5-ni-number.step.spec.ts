import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { expect } from "chai";
import { niNumberStep } from "#/journeys/create-application/steps/5-ni-number.step.js";
import { createStepClient } from "../../utils/helpers.js";

describe("NI number step", () => {
  const client = createStepClient(niNumberStep("testJourney"));

  describe("GET /create-application/ni-number", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/create-application/ni-number");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Does your client have a National Insurance number?",
      );
    });

    it("renders two radio options", () => {
      const items = radioInput.properties.items as { text: string }[];
      expect(items.length).to.equal(2);
      expect(items[0].text).to.equal("Yes");
      expect(items[1].text).to.equal("No");
    });
  });

  it("shows a validation error if no option is selected", async () => {
    const result = await client.post("/create-application/ni-number");
    expect(result.type).to.equal("render");
    const renderResult = result as TestRenderResult;
    expect(renderResult.context.showValidationFailures).to.equal(true);
    expect(renderResult.context.fieldValidationErrors[0].message).to.equal(
      "Select if your client has a National Insurance number",
    );
  });

  it("shows a validation error if yes is selected but no NI number is given", async () => {
    const result = await client.post("/create-application/ni-number", {
      body: { hasNINumber: "yes" },
    });
    expect(result.type).to.equal("render");
    const renderResult = result as TestRenderResult;
    expect(renderResult.context.showValidationFailures).to.equal(true);
    expect(renderResult.context.fieldValidationErrors[0].message).to.equal(
      "Enter your client's National Insurance number",
    );
  });

  it("shows a validation error if the NI number is invalid", async () => {
    const result = await client.post("/create-application/ni-number", {
      body: { hasNINumber: "yes", niNumber: "ZZ123456C" },
    });
    expect(result.type).to.equal("render");
    const renderResult = result as TestRenderResult;
    expect(renderResult.context.showValidationFailures).to.equal(true);
    expect(renderResult.context.fieldValidationErrors[0].message).to.equal(
      "Enter a National Insurance number that is 2 letters, 6 numbers, then A, B, C or D, like QQ 12 34 56 C",
    );
  });

  it("redirects to the home address step when a valid NI number is given", async () => {
    const result = await client.post("/create-application/ni-number", {
      body: { hasNINumber: "yes", niNumber: "JN123456A" },
    });
    expect(result.type).to.equal("redirect");
    const redirectResult = result as TestRedirectResult;
    expect(redirectResult.url).to.equal("/create-application/have-a-home-address");
  });

  it("redirects to the home address step when no is selected", async () => {
    const result = await client.post("/create-application/ni-number", {
      body: { hasNINumber: "no" },
    });
    expect(result.type).to.equal("redirect");
    const redirectResult = result as TestRedirectResult;
    expect(redirectResult.url).to.equal("/create-application/have-a-home-address");
  });
});
