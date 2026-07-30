import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { checkAnswersStep } from "#/journeys/create-application/steps/check-answers.step.js";

describe("Check answers step", () => {
  const client = createForgeTestClient(
    "Record new case",
    "/cases/new/",
    checkAnswersStep("testJourney"),
  );
  const session = {
    journeyDrafts: {
      testJourney: {
        ecf: "no",
        legalAidBefore: "yesSameMatter",
        legalAidLast6Months: "yes",
        reasonForHelp: "Some reason for help",
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
        hasNINumber: "yes",
        niNumber: "AB123456C",
        haveAHomeAddress: "yes",
        addressLine1: "123 Test Street",
        townOrCity: "Testville",
        postcode: "TE5 7ST",
        country: "United Kingdom",
      },
    },
  };

  describe("GET /cases/new/check-answers", () => {
    let renderResult: TestRenderResult;
    let summaryList: RenderBlock;
    let submitButton: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/new/check-answers", {
        session,
      });
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [summaryList] = renderResult.getBlocksByVariant("govukSummaryList");
      [submitButton] = renderResult.getBlocksByVariant("govukButton");
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal("Check your answers");
    });

    it("renders a summary list", () => {
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
      }>;
      expect(rows.length).to.equal(9);
      expect(rows[0].key.text).to.equal("ECF");
      expect(rows[1].key.text).to.equal("Accessed legal aid before");
      expect(rows[2].key.text).to.equal("Did your client get legal help for this matter in the last 6 months?");
      expect(rows[3].key.text).to.equal("Reason for new application for same matter");
      expect(rows[4].key.text).to.equal("First name");
      expect(rows[5].key.text).to.equal("Last name");
      expect(rows[6].key.text).to.equal("Date of birth");
      expect(rows[7].key.text).to.equal("National Insurance number");
      expect(rows[8].key.text).to.equal("Address");
    });

    it("renders the national insurance number when hasNINumber is 'yes'", () => {
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
      }>;
      const niNumberRow = rows.find(
        (row) => row.key.text === "National Insurance number",
      );

      expect(niNumberRow).to.not.be.undefined;
    });

    it("renders the address in the correct format", () => {
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
        value: { html: string };
      }>;
      const addressRow = rows.find((row) => row.key.text === "Address");

      expect(addressRow?.value.html).to.match(
        /123 Test Street,<br \/>.*Testville,<br \/>.*TE5 7ST/s,
      );
    });

    it("renders the date of birth in the correct format", () => {
      const rows = summaryList.properties.rows as Array<{
        key: { text: string };
        value: { text: string };
      }>;
      const dobRow = rows.find((row) => row.key.text === "Date of birth");

      expect(dobRow?.value.text).to.equal("1 January 1990");
    });

    it("renders the submit button", () => {
      expect(submitButton.properties.text).to.equal("Save and continue");
    });
  });

  describe("POST /cases/new/check-answers", () => {
    it("redirects to the confirmation step", async () => {
      const result = await client.post("/cases/new/check-answers", {
        session,
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases/CW-123456/task-list");
    });
  });
});
