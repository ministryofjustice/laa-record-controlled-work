import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const BASE_ANSWERS = {
  client_age: "standard",
  employment_status: "unemployed",
  immigration_or_asylum: false,
  level_of_help: "controlled",
  partner: true,
  partner_employment_status: "unemployed",
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

describe("saved other income answers", () => {
  before(initializeI18nextSync);

  it("shows client other income in CCQ order with entered frequencies", () => {
    const otherIncome = summaries({
      friends_or_family_conditional_value: 50,
      friends_or_family_frequency: "every_week",
      friends_or_family_relevant: true,
      maintenance_conditional_value: 999,
      maintenance_frequency: "monthly",
      maintenance_relevant: false,
      other_conditional_value: 75,
      other_relevant: true,
      pension_conditional_value: 90,
      pension_frequency: "monthly",
      pension_relevant: true,
      property_or_lodger_conditional_value: 120,
      property_or_lodger_frequency: "every_two_weeks",
      property_or_lodger_relevant: true,
      student_finance_conditional_value: 240,
      student_finance_relevant: true,
    }).find(({ heading }) => heading === "Client other income");

    expect(otherIncome?.rows).to.deep.equal([
      {
        key: "Does your client get financial help from friends or family?",
        value: "Yes",
      },
      { key: "Amount", value: "£50.00" },
      { key: "Frequency", value: "Every week" },
      {
        key: "Does your client get maintenance from a former partner?",
        value: "No",
      },
      {
        key: "Does your client get income from a property or lodger?",
        value: "Yes",
      },
      { key: "Amount", value: "£120.00" },
      { key: "Frequency", value: "Every 2 weeks" },
      { key: "Does your client get income from pensions?", value: "Yes" },
      { key: "Amount", value: "£90.00" },
      { key: "Frequency", value: "Monthly" },
      {
        key: "Does your client get income from student finance?",
        value: "Yes",
      },
      { key: "Amount", value: "£240.00" },
      {
        key: "Does your client get income from other sources?",
        value: "Yes",
      },
      { key: "Amount", value: "£75.00" },
    ]);
  });

  it("preserves every-four-weeks regular income frequency", () => {
    const otherIncome = summaries({
      maintenance_conditional_value: 80,
      maintenance_frequency: "every_four_weeks",
      maintenance_relevant: true,
    }).find(({ heading }) => heading === "Client other income");

    expect(otherIncome?.rows.slice(1, 4)).to.deep.equal([
      {
        key: "Does your client get maintenance from a former partner?",
        value: "Yes",
      },
      { key: "Amount", value: "£80.00" },
      { key: "Frequency", value: "Every 4 weeks" },
    ]);
  });

  it("keeps relevant other income when employment is unavailable", () => {
    const answerSummaries = summaries({
      employment_status: "unemployed",
      friends_or_family_conditional_value: 40,
      friends_or_family_frequency: "monthly",
      friends_or_family_relevant: true,
      incomes: [
        {
          gross_income: 1000,
          income_frequency: "monthly",
          income_tax: 0,
          income_type: "employment",
          national_insurance: 0,
        },
      ],
    });

    expect(
      answerSummaries.find(({ heading }) =>
        heading.includes("employment income"),
      ),
    ).to.equal(undefined);
    expect(
      answerSummaries
        .find(({ heading }) => heading === "Client other income")
        ?.rows.slice(0, 3),
    ).to.deep.equal([
      {
        key: "Does your client get financial help from friends or family?",
        value: "Yes",
      },
      { key: "Amount", value: "£40.00" },
      { key: "Frequency", value: "Monthly" },
    ]);
  });

  it("omits partner other income after partner removal", () => {
    expect(
      summaries({
        partner: false,
        partner_friends_or_family_conditional_value: 20,
        partner_friends_or_family_frequency: "monthly",
        partner_friends_or_family_relevant: true,
      }).filter(({ heading }) => heading === "Partner other income"),
    ).to.deep.equal([]);
  });
});