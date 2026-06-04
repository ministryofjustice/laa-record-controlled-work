import { TestRenderResult, TestRedirectResult } from "@ministryofjustice/hmpps-forge/core/testing";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { expect } from "chai";
import { haveAHomeAddressStep } from "#/journeys/create-application/steps/6-have-a-home-address.step.js";
import { createStepClient } from "../../utils/helpers.js";

describe("Have A Home Address Step", () => {
  const client = createStepClient(haveAHomeAddressStep("testJourney"));

  describe("GET /create-application/have-a-home-address", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/create-application/have-a-home-address");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Does your client have a home address?",
      );
    });

    it("renders two radio options", () => {
      const buttons = radioInput.properties.items as { text: string }[];
      expect(buttons.length).to.equal(2);
      expect(buttons[0].text).to.equal("Yes");
      expect(buttons[1].text).to.equal("No, they have no fixed address");
    });

    it("renders the hint text", () => {
      const hint = radioInput.properties.hint as { text: string };
      expect(hint.text).to.equal(
        "The home address is the place that they normally live in, and sometimes called the main dwelling.",
      );
    });
  });

  it("should show validation error if no option is selected", async () => {
    const result = await client.post("/create-application/have-a-home-address");

    expect(result.type).to.equal("render");
    const renderResult = result as TestRenderResult;
    expect(renderResult.context.showValidationFailures).to.equal(true);
    expect(renderResult.context.fieldValidationErrors[0].message).to.deep.equal(
      "Select if your client has a home address",
    );
  });

  it("should redirect to Enter address manually step if yes", async () => {
    const result = await client.post(
      "/create-application/have-a-home-address",
      {
        body: {
          haveAHomeAddress: "yes",
        },
      },
    );
    expect(result.type).to.equal("redirect");
    const redirectResult = result as TestRedirectResult;
    expect(redirectResult.url).to.equal("/create-application/enter-address-manually");
  });

  it("should redirect to Need means assessment step if no", async () => {
    const result = await client.post(
      "/create-application/have-a-home-address",
      {
        body: {
          haveAHomeAddress: "no",
        },
      },
    );
    expect(result.type).to.equal("redirect");
    const redirectResult = result as TestRedirectResult;
    expect(redirectResult.url).to.equal("/create-application/need-means-assessment");
  });
});
