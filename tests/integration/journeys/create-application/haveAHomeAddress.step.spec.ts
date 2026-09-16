import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createApplicationEffectsRegistry } from "#/journeys/create-application/create-application.effects.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { createApplicationJourney } from "#/journeys/create-application/create-application.journey.js";

describe("Have A Home Address Step", () => {
  const client = createForgeTestClient(
    createApplicationJourney,
    createApplicationEffectsRegistry,
  );

  describe("GET /cases/new/have-a-home-address", () => {
    let renderResult: TestRenderResult;
    let radioInput: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/new/have-a-home-address");
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

  describe("POST /cases/new/have-a-home-address", () => {
    const fieldCode = "haveAHomeAddress";

    it("should show validation error if no option is selected", async () => {
      const result = await client.post("/cases/new/have-a-home-address");

      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
      ).to.deep.equal("Select if your client has a home address");
    });

    it("should redirect to Enter address manually step if yes", async () => {
      const result = await client.post("/cases/new/have-a-home-address", {
        body: {
          haveAHomeAddress: "yes",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/enter-address-manually");
    });

    it("should preserve check answers when redirecting to enter address manually", async () => {
      const result = await client.post("/cases/new/have-a-home-address", {
        query: { returnTo: "check-answers" },
        body: {
          haveAHomeAddress: "yes",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(
        "/cases/new/enter-address-manually?returnTo=check-answers",
      );
    });

    it("should return to check answers when no is selected from check answers", async () => {
      const session = {
        journeyDrafts: {
          createApplication: {
            haveAHomeAddress: "yes",
            ukAddressLine1: "10 Some Street",
            ukTownOrCity: "SomeCity",
            ukPostcode: "AB1 2CD",
            ukCountry: "United Kingdom",
            osAddressLine1: "10 Some Other Street",
            osCountry: "Australia",
          },
        },
      };
      const result = await client.post("/cases/new/have-a-home-address", {
        query: { returnTo: "check-answers" },
        body: {
          haveAHomeAddress: "no",
        },
        session,
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/check-answers");
      expect(session.journeyDrafts.createApplication).to.deep.equal({
        haveAHomeAddress: "no",
      });
    });

    it("should redirect to Check answers step if no", async () => {
      const result = await client.post("/cases/new/have-a-home-address", {
        body: {
          haveAHomeAddress: "no",
        },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/check-answers");
    });
  });
});
