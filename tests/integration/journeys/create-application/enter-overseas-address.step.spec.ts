import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import {
  CreateApplicationEffects,
  createApplicationEffectsRegistry,
} from "#/journeys/create-application/create-application.effects.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { createTestClient } from "../../utils/helpers.js";
import { enterOverseasAddressStep } from "#/journeys/create-application/steps/enter-overseas-address.step.js";

describe("Enter overseas address step", () => {
  const client = createTestClient({
    effects: [CreateApplicationEffects.loadDraftAnswers("testJourney")],
    path: "/cases/new/",
    steps: [enterOverseasAddressStep("testJourney")],
    testEffects: createApplicationEffectsRegistry,
  });

  describe("GET /cases/new/enter-overseas-address", () => {
    let renderResult: TestRenderResult;
    let countryInput: RenderBlock;
    let addressLine1Input: RenderBlock;
    let addressLine2Input: RenderBlock;
    let addressLine3Input: RenderBlock;
    let addressLine4Input: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/new/enter-overseas-address");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;

      const [autocompleteBlock] = renderResult.getBlocksByVariant("autocomplete");

      countryInput = autocompleteBlock.properties.field as RenderBlock;
      [addressLine1Input, addressLine2Input, addressLine3Input, addressLine4Input] =
        renderResult.getBlocksByVariant("govukTextInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal("Enter your client's overseas home address");
    });

    it("renders a country input", () => {
      const label = countryInput.properties.label as { text: string };
      expect(label.text).to.equal("Country");
    });    

    it("renders an address line 1 input", () => {
      const label = addressLine1Input.properties.label as { text: string };
      expect(label.text).to.equal("Address line 1");
    });

    it("renders an address line 2 input", () => {
      const label = addressLine2Input.properties.label as { text: string };
      expect(label.text).to.equal("Address line 2 (optional)");
    });

    it("renders an address line 3 input", () => {
      const label = addressLine3Input.properties.label as { text: string };
      expect(label.text).to.equal("Address line 3 (optional)");
    });
    
    it("renders an address line 4 input", () => {
      const label = addressLine4Input.properties.label as { text: string };
      expect(label.text).to.equal("Address line 4 (optional)");
    });    
  });

  describe("POST /cases/new/enter-overseas-address", () => {
    const validBody = {
      country: "Ireland",
      addressLine1: "10 Some Street",
      addressLine2: "",
      addressLine3: "",
      addressLine4: "",
    };

    it("should redirect to check-answers when given valid data", async () => {
      const result = await client.post("/cases/new/enter-overseas-address", {
        body: validBody,
      });

      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/check-answers");
    });

    const validationErrorTests: Array<{
      description: string;
      body: Partial<typeof validBody>;
      expectedMessage: string;
      fieldCode: string;
    }> = [
      {
        description: "address line 1 is missing",
        body: { ...validBody, addressLine1: "" },
        expectedMessage: "Enter address line 1, typically the building and street",
        fieldCode: "addressLine1",
      },
      {
        description: "country is missing",
        body: { ...validBody, country: "" },
        expectedMessage: "Enter country",
        fieldCode: "country",
      },
    ];

    for (const { description, body, expectedMessage, fieldCode } of validationErrorTests) {
      it(`should show validation error when ${description}`, async () => {
        const result = await client.post("/cases/new/enter-overseas-address", {
          body,
        });

        expect(result.type).to.equal("render");
        const renderResult = result as TestRenderResult;
        expect(renderResult.context.showValidationFailures).to.equal(true);
        expect(
          renderResult.getValidationErrorsByFieldCode(fieldCode)[0].message,
        ).to.deep.equal(expectedMessage);
      });
    }
  });
});

