import { expect } from "chai";
import { clientDetailsStep } from "#/journeys/create-application/steps/4-client-details.step.js";
import { createStepClient } from "../../utils/helpers.js";

describe("Client details step", () => {
  const client = createStepClient(clientDetailsStep("testJourney"));

  it("should render the client details form on GET", async () => {
    const result = await client.get("/create-application/client-details");
    expect(result.type).to.equal("render");
  });

  it("should redirect to the check answers page when given valid data", async () => {
    const result = await client.post("/create-application/client-details", {
      body: {
        fullName: "John Doe",
        dateOfBirth: { year: "2000", month: "2", day: "2" },
      } as unknown as Record<string, string | string[]>,
    });

    expect(result.type).to.equal("redirect");
    if (result.type === "redirect") {
      expect(result.url).to.equal("/create-application/ni-number");
    }
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

  for (const { description, body, expectedMessage, fieldCode } of validationErrorTests) {
    it(`should show validation error when ${description}`, async () => {
      const result = await client.post("/create-application/client-details", {
        body: body as unknown as Record<string, string | string[]>,
      });

      expect(result.type).to.equal("render");
      if (result.type === "render") {
        expect(result.context.showValidationFailures).to.equal(true);
        expect(
          result.getValidationErrorsByFieldCode(fieldCode)[0].message,
        ).to.deep.equal(expectedMessage);
      }
    });
  }
});
