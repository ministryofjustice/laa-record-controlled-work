import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { enterAddressManuallyStep } from "#/journeys/create-application/steps/enter-address-manually.step.js";

describe("Enter address manually step", () => {
  const client = createForgeTestClient("Record new case", "/cases/new/", [
    enterAddressManuallyStep("testJourney"),
  ]);

  describe("GET /cases/new/enter-address-manually", () => {
    let renderResult: TestRenderResult;
    let addressLine1Input: RenderBlock;
    let addressLine2Input: RenderBlock;
    let townOrCityInput: RenderBlock;
    let countyInput: RenderBlock;
    let postcodeInput: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/new/enter-address-manually");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [
        addressLine1Input,
        addressLine2Input,
        townOrCityInput,
        countyInput,
        postcodeInput,
      ] = renderResult.getBlocksByVariant("govukTextInput");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Enter your client's home address",
      );
    });

    it("renders a link to the overseas address page", () => {
      const linkBlock = renderResult
        .getBlocksByVariant("html")
        .find((b) =>
          (b.properties.content as string).includes("/enter-overseas-address"),
        );
      expect(linkBlock).to.exist;
      expect(linkBlock!.properties.content as string).to.contain(
        "The address is not in the UK",
      );
    });

    it("renders an address line 1 input", () => {
      const label = addressLine1Input.properties.label as { text: string };
      expect(label.text).to.equal("Address line 1");
    });

    it("renders an address line 2 input", () => {
      const label = addressLine2Input.properties.label as { text: string };
      expect(label.text).to.equal("Address line 2 (optional)");
    });

    it("renders a town or city input", () => {
      const label = townOrCityInput.properties.label as { text: string };
      expect(label.text).to.equal("Town or city");
    });

    it("renders a county input", () => {
      const label = countyInput.properties.label as { text: string };
      expect(label.text).to.equal("County (optional)");
    });

    it("renders a postcode input", () => {
      const label = postcodeInput.properties.label as { text: string };
      expect(label.text).to.equal("Postcode");
    });
  });

  describe("POST /cases/new/enter-address-manually", () => {
    const validBody = {
      addressLine1: "10 Some Street",
      addressLine2: "",
      townOrCity: "SomeCity",
      county: "",
      postcode: "AB1 2CD",
    };

    it("should redirect to check-answers when given valid data", async () => {
      const result = await client.post("/cases/new/enter-address-manually", {
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
        expectedMessage:
          "Enter address line 1, typically the building and street",
        fieldCode: "addressLine1",
      },
      {
        description: "town or city is missing",
        body: { ...validBody, townOrCity: "" },
        expectedMessage: "Enter town or city",
        fieldCode: "townOrCity",
      },
      {
        description: "postcode is missing",
        body: { ...validBody, postcode: "" },
        expectedMessage: "Enter postcode",
        fieldCode: "postcode",
      },
      {
        description: "postcode is invalid",
        body: { ...validBody, postcode: "INVALID" },
        expectedMessage: "Enter a valid postcode, for example SW1A 1AA",
        fieldCode: "postcode",
      },
    ];

    for (const {
      description,
      body,
      expectedMessage,
      fieldCode,
    } of validationErrorTests) {
      it(`should show validation error when ${description}`, async () => {
        const result = await client.post("/cases/new/enter-address-manually", {
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
