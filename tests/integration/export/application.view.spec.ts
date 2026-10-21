import express from "express";
import request from "supertest";

import { faker } from "@faker-js/faker";
import { expect } from "chai";
import { describe, it } from "mocha";

import config from "#/config.js";
import type { ClientAndCaseDetailsSection } from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.types.js";
import type { MeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.types.js";

import { toCalculationBreakdowns } from "#/export/sections/meansAssessment/calculations/calculations.format.js";
import { setupNunjucks } from "#/middleware/setupNunjucks.js";

type MeansAssessmentView = Pick<
  MeansAssessmentSection,
  "answerSummaries" | "calculationBreakdowns" | "outcomeSummary"
>;

const formattedAddress = [
  faker.location.streetAddress(),
  faker.location.city(),
  faker.location.zipCode(),
];
const dateOfBirth = faker.date
  .birthdate({ max: 90, min: 18, mode: "age" })
  .toISOString()
  .slice(0, 10);
const formattedDateOfBirth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
}).format(new Date(dateOfBirth));
const firstName = faker.person.firstName();
const lastName = "Smith";
const typeOfFamilyLaw = faker.lorem.words(3);
const confirmMerits = faker.lorem.sentence();
const evidenceCaseIsInScope = faker.lorem.sentence();
const reasonForReapplication = faker.lorem.sentence();
const niNumber = `AA${faker.string.numeric(6)}C`;

const clientAndCaseDetails: ClientAndCaseDetailsSection = {
  heading: "Client and case details",
  rows: [
    { key: { text: "ECF" }, value: { text: "No" } },
    { key: { text: "Type of family law" }, value: { text: typeOfFamilyLaw } },
    {
      key: {
        text: "Transitional EU arrangements or an international maintenance agreement?",
      },
      value: { text: "No" },
    },
    {
      key: { text: "Legal aid to protect themself or their children?" },
      value: { text: "Yes" },
    },
    {
      key: { text: "Evidence case is in scope" },
      value: { text: evidenceCaseIsInScope },
    },
    { key: { text: "Confirm merits" }, value: { text: confirmMerits } },
    { key: { text: "Accessed legal aid before" }, value: { text: "No" } },
    {
      key: { text: "For the same matter within 6 months" },
      value: { text: "Yes" },
    },
    {
      key: { text: "Reason for reapplication" },
      value: { text: reasonForReapplication },
    },
    { key: { text: "First name" }, value: { text: firstName } },
    { key: { text: "Last name" }, value: { text: lastName } },
    { key: { text: "Date of birth" }, value: { text: formattedDateOfBirth } },
    { key: { text: "National Insurance number" }, value: { text: niNumber } },
    {
      key: { text: "Address" },
      value: { html: formattedAddress.join("<br>") },
    },
  ],
};

const meansAssessmentData = {
  answerSummaries: [
    {
      cards: [
        {
          heading: "Client age",
          rows: [
            {
              key: "What age is your client?",
              value: "<script>alert(1)</script>",
            },
          ],
        },
      ],
      heading: "Client details",
    },
  ],
  capitalBreakdown: {
    description: [
      "The calculations below assess the value of any property the client owns.",
      "The assessed values are used to calculate the total disposable capital for your client.",
    ],
    heading: "Capital calculation",
    status: "ready",
    tables: [
      {
        heading: "Home client lives in",
        hint: null,
        rows: [
          { amount: "£300,000.00", heading: "Estimated value", hint: null },
          {
            amount: "£93,456.78",
            emphasis: true,
            heading: "Assessed value",
            hint: null,
          },
        ],
      },
    ],
  },
  incomeBreakdown: {
    heading: "Income calculation",
    status: "ready",
    tables: [
      {
        heading: "Client's monthly income",
        hint: "All figures have been converted into a monthly amount.",
        rows: [
          {
            amount: "£500.00",
            heading: "Employment income",
            hint: null,
          },
          {
            amount: "£0.00",
            heading: "Benefits received",
            hint: "This does not include Housing Benefit",
          },
        ],
      },
      {
        heading: "Total",
        hint: null,
        rows: [
          {
            amount: "£500.00",
            emphasis: true,
            heading: "Total monthly income",
            hint: null,
          },
          {
            amount: "£2,000.00",
            heading: "Monthly income upper limit",
            hint: null,
          },
        ],
      },
    ],
  },
  outgoingsBreakdown: {
    heading: "Outgoings calculation",
    status: "ready",
    tables: [
      {
        heading: "Client's monthly outgoings",
        hint: "All figures have been converted into a monthly amount.",
        rows: [
          {
            amount: "-£20.00",
            heading: "Income tax",
            hint: null,
          },
          {
            additionalHint:
              "Housing costs are capped at £545 for single clients without dependants",
            amount: "£400.00",
            heading: "Housing payments",
            hint: "Housing costs minus any Housing Benefit payments your client gets",
          },
        ],
      },
      {
        heading: "Total",
        hint: null,
        rows: [
          {
            amount: "£700.00",
            emphasis: true,
            heading: "Total monthly outgoings",
            hint: null,
          },
        ],
      },
    ],
  },
  outcomeSummary: {
    heading: "Means assessment",
    outcome: {
      contributions: [],
      description:
        "Your client qualifies financially for civil legal aid based on the information you entered. Before you (or a provider of advice or services funded by legal aid) proceed with your client's case, it must also be within scope for legal aid and satisfy the relevant merits criteria set out in the relevant legislation and guidance. These calculations were made in line with the latest version of the Lord Chancellor's Guidance on Determining Financial Eligibility for Controlled Work.",
      heading: "Your client is financially eligible for controlled work.",
    },
    totals: {
      heading: "Your client's key eligibility totals",
      items: [
        {
          amount: "£500",
          detail: "Below the saved upper limit.",
          heading: "Gross monthly income",
        },
      ],
    },
    yourAnswersHeading: "Your answers",
  },
} satisfies Omit<MeansAssessmentSection, "calculationBreakdowns" | "calculations">;

const meansAssessment: MeansAssessmentView = {
  ...meansAssessmentData,
  calculationBreakdowns: toCalculationBreakdowns([
    meansAssessmentData.incomeBreakdown,
    meansAssessmentData.outgoingsBreakdown,
    meansAssessmentData.capitalBreakdown,
  ]),
};

function createViewApp(section: MeansAssessmentView = meansAssessment) {
  const app = express();
  setupNunjucks(app);
  app.use((_req, res, next) => {
    res.locals.config = config;
    next();
  });
  app.get("/export", (req, res) => {
    res.render("export/application", {
      applicationRefNumber: req.query.reference ?? null,
      clientAndCaseDetails,
      clientName: req.query.client ?? null,
      meansAssessment: section,
    });
  });
  return app;
}

describe("export application view", () => {
  it("renders the escaped header values and local assets", async () => {
    const response = await request(createViewApp()).get("/export").query({
      client: "Jane <script> & Doe",
      reference: "CW-<123>",
    });

    expect(response.status).to.equal(200);
    expect(response.text).to.match(
      /<title>Record civil controlled work - Export<\/title>/,
    );
    expect(response.text).to.include("Jane &lt;script&gt; &amp; Doe");
    expect(response.text).to.include("CW-&lt;123&gt;");
    expect(response.text).to.match(/<h1[^>]*>Record Controlled Work<\/h1>/);
    expect(response.text).to.match(/<img[^>]+alt="Legal Aid Agency logo"/);
    expect(response.text).to.match(
      /<link[^>]+rel="stylesheet"[^>]+href="\/css\/[^"?]+\.css"/,
    );
    expect(response.text).to.match(
      /<img[^>]+src="\/views\/icons\/laa-logo\.svg"/,
    );
    expect(response.text).to.not.include(
      "ebd50ba0-9ed9-4003-83a8-c11ac07d9e32",
    );
    expect(response.text).to.not.include("providerOfficeCode");
  });

  it("renders Not provided for missing client and reference values", async () => {
    const response = await request(createViewApp()).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text.match(/Not provided/g)).to.have.length(2);
  });

  it("renders the client and case summary values", async () => {
    const response = await request(createViewApp()).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text).to.match(/<h2[^>]*>Client and case details<\/h2>/);
    expect(response.text).to.include("ECF");
    expect(response.text).to.include("No");
    expect(response.text).to.include("Type of family law");
    expect(response.text).to.include(typeOfFamilyLaw);
    expect(response.text).to.include(
      "Transitional EU arrangements or an international maintenance agreement?",
    );
    expect(response.text).to.include("No");
    expect(response.text).to.include(
      "Legal aid to protect themself or their children",
    );
    expect(response.text).to.include("Yes");
    expect(response.text).to.include("Evidence case is in scope");
    expect(response.text).to.include(evidenceCaseIsInScope);
    expect(response.text).to.include("Confirm merits");
    expect(response.text).to.include(confirmMerits);
    expect(response.text).to.include("Accessed legal aid before");
    expect(response.text).to.include("For the same matter within 6 months");
    expect(response.text).to.include("Yes");
    expect(response.text).to.include("Reason for reapplication");
    expect(response.text).to.include(reasonForReapplication);
    expect(response.text).to.include("First name");
    expect(response.text).to.include(firstName);
    expect(response.text).to.include("Last name");
    expect(response.text).to.include(lastName);
    expect(response.text).to.include("Date of birth");
    expect(response.text).to.include(formattedDateOfBirth);
    expect(response.text).to.include("National Insurance number");
    expect(response.text).to.include(niNumber);
    expect(response.text).to.include("Address");
    expect(response.text).to.include(formattedAddress[0]);
    expect(response.text).to.include(formattedAddress[1]);
    expect(response.text).to.include(formattedAddress[2]);
  });

  it("renders prepared means totals and answer cards", async () => {
    const response = await request(createViewApp()).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text).to.include("<h2");
    expect(response.text).to.include("Means assessment");
    expect(response.text).to.include(
      meansAssessment.outcomeSummary.outcome.description.replaceAll(
        "'",
        "&#39;",
      ),
    );
    expect(response.text).to.include(
      "Your client&#39;s key eligibility totals",
    );
    expect(response.text).to.include("Gross monthly income");
    expect(response.text).to.include("£500");
    expect(response.text).to.include("Your answers");
    expect(response.text).to.include("Client details");
    expect(response.text).to.include("Client age");
    expect(response.text).to.include(
      '<dl class="govuk-summary-list app-means-assessment__summary-list">',
    );
    expect(response.text).to.include("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(response.text).not.to.include("<script>alert(1)</script>");
    expect(response.text.indexOf("Client and case details")).to.be.lessThan(
      response.text.indexOf("Means assessment"),
    );
    expect(response.text.indexOf("Your answers")).to.be.lessThan(
      response.text.indexOf("Client details"),
    );
  });

  it("renders income tables before saved answers with semantic row headers", async () => {
    const response = await request(createViewApp()).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text).to.include("Income calculation");
    expect(response.text).to.include(
      "All figures have been converted into a monthly amount.",
    );
    expect(response.text).to.include("This does not include Housing Benefit");
    expect(response.text).to.match(
      /<th scope="row" class="govuk-table__header app-calculation__row-heading">\s*Employment income/,
    );
    expect(response.text).to.match(
      /<td class="govuk-table__cell app-calculation__amount">\s*£500\.00\s*<\/td>/,
    );
    expect(response.text).to.match(
      /<th scope="row" class="govuk-table__header app-calculation__row-heading app-calculation__cell--emphasis">\s*Total monthly income/,
    );
    expect(response.text).to.match(
      /<td class="govuk-table__cell app-calculation__amount app-calculation__cell--emphasis">\s*£500\.00\s*<\/td>/,
    );
    expect(
      response.text.indexOf("Your client's key eligibility totals"),
    ).to.be.lessThan(response.text.indexOf("Income calculation"));
    expect(response.text.indexOf("Income calculation")).to.be.lessThan(
      response.text.indexOf("Your answers"),
    );
  });

  it("renders outgoing tables with additional hints before saved answers", async () => {
    const response = await request(createViewApp()).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text).to.include("Outgoings calculation");
    expect(response.text).to.include("Client&#39;s monthly outgoings");
    expect(response.text).to.include("Housing costs are capped at £545");
    expect(response.text).to.match(
      /<th scope="row" class="govuk-table__header app-calculation__row-heading">\s*Income tax/,
    );
    expect(response.text).to.match(
      /<td class="govuk-table__cell app-calculation__amount">\s*-£20\.00\s*<\/td>/,
    );
    expect(response.text.indexOf("Income calculation")).to.be.lessThan(
      response.text.indexOf("Outgoings calculation"),
    );
    expect(response.text.indexOf("Outgoings calculation")).to.be.lessThan(
      response.text.indexOf("Your answers"),
    );
  });

  it("renders capital property tables after other calculations and before answers", async () => {
    const response = await request(createViewApp()).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text).to.include("Capital calculation");
    expect(response.text).to.include(
      "The calculations below assess the value of any property the client owns.",
    );
    expect(response.text).to.match(
      /<caption[^>]*>Home client lives in<\/caption>/,
    );
    expect(response.text).to.match(
      /<th scope="row" class="govuk-table__header app-calculation__row-heading">\s*Estimated value/,
    );
    expect(response.text).to.match(
      /<td class="govuk-table__cell app-calculation__amount">\s*£300,000\.00\s*<\/td>/,
    );
    expect(response.text.indexOf("Outgoings calculation")).to.be.lessThan(
      response.text.indexOf("Capital calculation"),
    );
    expect(response.text.indexOf("Capital calculation")).to.be.lessThan(
      response.text.indexOf("Your answers"),
    );
  });

  it("omits calculation headings and tables when no breakdowns are displayable", async () => {
    const response = await request(createViewApp({
      ...meansAssessment,
      calculationBreakdowns: [],
    })).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text).not.to.include("Income calculation");
    expect(response.text).not.to.include("Outgoings calculation");
    expect(response.text).not.to.include("app-means-assessment__calculation-table");
    expect(response.text).to.include("Your answers");
  });

  it("renders an unavailable breakdown beside ready calculation tables", async () => {
    const response = await request(createViewApp({
      ...meansAssessment,
      calculationBreakdowns: [
        {
          description: [],
          heading: "Income calculation",
          message: "Income calculation details are unavailable.",
          tables: [],
        },
        ...meansAssessment.calculationBreakdowns.filter(
          (breakdown) => breakdown.heading === "Outgoings calculation",
        ),
      ],
    })).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text).to.include("Income calculation details are unavailable.");
    expect(response.text).not.to.include("Client&#39;s monthly income");
    expect(response.text).to.include("Client&#39;s monthly outgoings");
    expect(response.text.indexOf("Income calculation")).to.be.lessThan(
      response.text.indexOf("Outgoings calculation"),
    );
  });

  it("escapes calculation headings, amounts and both hint lines", async () => {
    const unsafe = '<script>"unsafe" & \'saved\'</script>';
    const escaped = "&lt;script&gt;&quot;unsafe&quot; &amp; &#39;saved&#39;&lt;/script&gt;";
    const response = await request(createViewApp({
      ...meansAssessment,
      calculationBreakdowns: toCalculationBreakdowns([{
        heading: unsafe,
        status: "ready",
        tables: [{
          heading: unsafe,
          hint: unsafe,
          rows: [{
            additionalHint: `Additional ${unsafe}`,
            amount: unsafe,
            heading: `Heading ${unsafe}`,
            hint: `Hint ${unsafe}`,
          }, {
            amount: "£0.00",
            heading: `Plain ${unsafe}`,
            hint: null,
          }],
        }],
      }]),
    })).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text).not.to.include(unsafe);
    expect(response.text).to.include(`Heading ${escaped}`);
    expect(response.text).to.include(`Hint ${escaped}</span>`);
    expect(response.text).to.include(`Additional ${escaped}</span>`);
    expect(response.text).to.include(`Plain ${escaped}`);
    expect(response.text).not.to.include("&amp;lt;script&amp;gt;");
  });
});
