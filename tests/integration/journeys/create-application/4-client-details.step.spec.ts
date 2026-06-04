import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { type BlockASTNode, type Evaluated } from "@ministryofjustice/hmpps-forge/core/framework";
import { expect } from "chai";
import { clientDetailsStep } from "#/journeys/create-application/steps/4-client-details.step.js";
import { createStepClient } from "../../utils/helpers.js";

describe("Client details step", () => {
  const client = createStepClient(clientDetailsStep("testJourney"));

  describe("GET /create-application/client-details", () => {
    let renderResult: TestRenderResult;
    let nameInput: Evaluated<BlockASTNode>;
    let dateInput: Evaluated<BlockASTNode>;

    before(async () => {
      const result = await client.get("/create-application/client-details");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [nameInput] = renderResult.getBlocksByVariant("govukTextInput");
      [dateInput] = renderResult.getBlocksByVariant("govukDateInputFull");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal("Your client's details");
    });

    it("renders a full name text input", () => {
      const label = nameInput.properties.label as { text: string };
      expect(label.text).to.equal("Full name");
    });

    it("renders a date of birth input", () => {
      const fieldset = dateInput.properties.fieldset as {
        legend: { text: string };
      };
      expect(fieldset.legend.text).to.equal("Date of birth");
    });

    it("renders hint text on the date of birth input", () => {
      const hint = dateInput.properties.hint as { text: string };
      expect(hint.text).to.equal("For example, 31 3 1980");
    });
  });

  describe("POST /create-application/client-details", () => {
    it("should redirect to the check answers page when given valid data", async () => {
      const result = await client.post("/create-application/client-details", {
        body: {
          fullName: "John Doe",
          dateOfBirth: { year: "2000", month: "2", day: "2" },
        } as unknown as Record<string, string | string[]>,
      });

      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/create-application/ni-number");
    });

    const validationErrorTests: Array<{
      description: string;
      body: Record<string, string | string[] | Record<string, string>>;
      expectedMessage: string;
      fieldCode: string;
    }> = [
      {
        description: "no name is provided",
        body: {
          fullName: "",
          dateOfBirth: { year: "2000", month: "2", day: "2" },
        },
        expectedMessage: "Enter your client's name",
        fieldCode: "fullName",
      },
      {
        description: "no date is provided",
        body: {
          fullName: "John Doe",
          dateOfBirth: { year: "", month: "", day: "" },
        },
        expectedMessage: "Enter your client's date of birth",
        fieldCode: "dateOfBirth",
      },
      {
        description: "date is incorrect",
        body: {
          fullName: "John Doe",
          dateOfBirth: { year: "2000", month: "2", day: "31" },
        },
        expectedMessage: "Date of birth must be a real date",
        fieldCode: "dateOfBirth",
      },
      {
        description: "day is missing",
        body: {
          fullName: "John Doe",
          dateOfBirth: { year: "2000", month: "2", day: "" },
        },
        expectedMessage: "Date of birth must include a day",
        fieldCode: "dateOfBirth",
      },
      {
        description: "month is missing",
        body: {
          fullName: "John Doe",
          dateOfBirth: { year: "2000", month: "", day: "1" },
        },
        expectedMessage: "Date of birth must include a month",
        fieldCode: "dateOfBirth",
      },
      {
        description: "year is missing",
        body: {
          fullName: "John Doe",
          dateOfBirth: { year: "", month: "2", day: "15" },
        },
        expectedMessage: "Date of birth must include a year",
        fieldCode: "dateOfBirth",
      },
      {
        description: "date is in the future",
        body: {
          fullName: "John Doe",
          dateOfBirth: { year: "3000", month: "12", day: "31" },
        },
        expectedMessage: "Date of birth must be in the past",
        fieldCode: "dateOfBirth",
      },
    ];

    for (const {
      description,
      body,
      expectedMessage,
      fieldCode,
    } of validationErrorTests) {
      it(`should show validation error when ${description}`, async () => {
        const result = await client.post("/create-application/client-details", {
          body: body as unknown as Record<string, string | string[]>,
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
