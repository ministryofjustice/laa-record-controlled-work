import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const BASE_ANSWERS = {
  client_age: "standard",
  immigration_or_asylum: false,
  level_of_help: "controlled",
  partner: true,
  passporting: false,
} satisfies EligibilityData;

function summaries(overrides: Partial<EligibilityData> = {}) {
  return (
    toMeansAssessmentSection(
      getGetApplicationResponseMock({
        eligibility: {
          data: { ...BASE_ANSWERS, ...overrides },
          result: null,
        },
        meansAssessmentRequired: true,
      }),
    )?.answerSummaries ?? []
  );
}

describe("saved employment income", () => {
  before(initializeI18nextSync);

  it("preserves client and partner entries, duplicates, frequencies, and zero deductions", () => {
    const answerSummaries = summaries({
      employment_status: "in_work",
      incomes: [
        {
          gross_income: 1000,
          income_frequency: "every_week",
          income_tax: 0,
          income_type: "employment",
          national_insurance: 0,
        },
        {
          gross_income: 900,
          income_frequency: "every_two_weeks",
          income_tax: 50,
          income_type: "employment",
          national_insurance: 25,
        },
        {
          gross_income: 800,
          income_frequency: "every_four_weeks",
          income_tax: 40,
          income_type: "statutory_pay",
          national_insurance: 20,
        },
        {
          gross_income: 700,
          income_frequency: "monthly",
          income_tax: 30,
          income_type: "self_employment",
          national_insurance: 15,
        },
        {
          gross_income: 600,
          income_frequency: "three_months",
          income_tax: 0,
          income_type: "employment",
          national_insurance: 0,
        },
      ],
      partner_employment_status: "in_work",
      partner_incomes: [
        {
          gross_income: 500,
          income_frequency: "monthly",
          income_tax: 0,
          income_type: "employment",
          national_insurance: 0,
        },
      ],
    });

    const incomeSummaries = answerSummaries.filter(({ heading }) =>
      heading.includes("employment income"),
    );

    expect(incomeSummaries.map(({ heading }) => heading)).to.deep.equal([
      "Client employment income 1",
      "Client employment income 2",
      "Client employment income 3",
      "Client employment income 4",
      "Client employment income 5",
      "Partner employment income 1",
    ]);
    expect(
      incomeSummaries.map(({ rows }) => rows.map(({ value }) => value)),
    ).to.deep.equal([
      ["A salary or wage", "Every week", "£1,000.00", "£0.00", "£0.00"],
      ["A salary or wage", "Every 2 weeks", "£900.00", "£50.00", "£25.00"],
      [
        "Statutory Sick Pay or Statutory Maternity Pay",
        "Every 4 weeks",
        "£800.00",
        "£40.00",
        "£20.00",
      ],
      ["Self-employment income", "Monthly", "£700.00", "£30.00", "£15.00"],
      ["A salary or wage", "Total in last 3 months", "£600.00", "£0.00", "£0.00"],
      ["A salary or wage", "Monthly", "£500.00", "£0.00", "£0.00"],
    ]);
  });

  it("hides employment entries for unemployed adults", () => {
    expect(
      summaries({
        employment_status: "unemployed",
        incomes: [
          {
            gross_income: 1000,
            income_frequency: "monthly",
            income_tax: 0,
            income_type: "employment",
            national_insurance: 0,
          },
        ],
        partner_employment_status: "unemployed",
        partner_incomes: [
          {
            gross_income: 500,
            income_frequency: "monthly",
            income_tax: 0,
            income_type: "employment",
            national_insurance: 0,
          },
        ],
      }).filter(({ heading }) => heading.includes("employment income")),
    ).to.deep.equal([]);
  });
});