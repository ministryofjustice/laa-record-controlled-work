import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import {
  CreateApplicationEffects,
  createApplicationEffectsRegistry,
} from "#/journeys/create-application/create-application.effects.js";
import { clientDetailsStep } from "#/journeys/create-application/steps/client-details.step.js";
import { createTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";

describe("Client details step", () => {
  const client = createTestClient({
    effects: [CreateApplicationEffects.loadDraftAnswers("testJourney")],
    path: "/cases/new/",
    steps: [clientDetailsStep("testJourney")],
    testEffects: createApplicationEffectsRegistry,
  });

  describe("GET /cases/new/client-details", () => {
    let renderResult: TestRenderResult;
    let firstNameInput: RenderBlock;
    let lastNameInput: RenderBlock;
    let dateInput: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/new/client-details");
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [firstNameInput, lastNameInput] =
        renderResult.getBlocksByVariant("govukTextInput");
      [dateInput] = renderResult.getBlocksByVariant("govukDateInputFull");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal("Your client's details");
    });

    it("renders a first name text input", () => {
      const label = firstNameInput.properties.label as { text: string };
      expect(label.text).to.equal("First name");
    });

    it("renders a last name text input", () => {
      const label = lastNameInput.properties.label as { text: string };
      expect(label.text).to.equal("Last name");
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

  describe("POST /cases/new/client-details", () => {
    it("should redirect to the check answers page when given valid data", async () => {
      const result = await client.post("/cases/new/client-details", {
        body: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: { year: "2000", month: "2", day: "2" },
        } as unknown as Record<string, string | string[]>,
      });

      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/new/ni-number");
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
          firstName: "",
          lastName: "",
          dateOfBirth: { year: "2000", month: "2", day: "2" },
        },
        expectedMessage: "Enter your client's first name",
        fieldCode: "firstName",
      },
      {
        description: "no first name is provided",
        body: {
          firstName: "",
          lastName: "Doe",
          dateOfBirth: { year: "2000", month: "2", day: "2" },
        },
        expectedMessage: "Enter your client's first name",
        fieldCode: "firstName",
      },
      {
        description: "no last name is provided",
        body: {
          firstName: "John",
          lastName: "",
          dateOfBirth: { year: "2000", month: "2", day: "2" },
        },
        expectedMessage: "Enter your client's last name",
        fieldCode: "lastName",
      },
      {
        description: "no date is provided",
        body: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: { year: "", month: "", day: "" },
        },
        expectedMessage: "Enter your client's date of birth",
        fieldCode: "dateOfBirth",
      },
      {
        description: "date is incorrect",
        body: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: { year: "2000", month: "2", day: "31" },
        },
        expectedMessage: "Date of birth must be a real date",
        fieldCode: "dateOfBirth",
      },
      {
        description: "day is missing",
        body: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: { year: "2000", month: "2", day: "" },
        },
        expectedMessage: "Date of birth must include a day",
        fieldCode: "dateOfBirth",
      },
      {
        description: "month is missing",
        body: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: { year: "2000", month: "", day: "1" },
        },
        expectedMessage: "Date of birth must include a month",
        fieldCode: "dateOfBirth",
      },
      {
        description: "year is missing",
        body: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: { year: "", month: "2", day: "15" },
        },
        expectedMessage: "Date of birth must include a year",
        fieldCode: "dateOfBirth",
      },
      {
        description: "date is in the future",
        body: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: { year: "3000", month: "12", day: "31" },
        },
        expectedMessage: "Date of birth must be in the past",
        fieldCode: "dateOfBirth",
      },
      {
        description: "date is too far in the past",
        body: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: { year: "1800", month: "12", day: "31" },
        },
        expectedMessage: "Date of birth must be after 1 January 1900",
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
        const result = await client.post("/cases/new/client-details", {
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
