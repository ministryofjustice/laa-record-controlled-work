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
  partner: false,
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

describe("saved employment answers", () => {
  before(initializeI18nextSync);

  it("shows client and partner employment status in CCQ order", () => {
    expect(
      summaries({
        employment_status: "unemployed",
        partner: true,
        partner_employment_status: "unemployed",
        partner_over_60: true,
      })
        .filter(({ heading }) =>
          ["Client income", "Partner age", "Partner income"].includes(heading),
        )
        .map(({ heading, rows }) => ({ heading, rows })),
    ).to.deep.equal([
      {
        heading: "Client income",
        rows: [
          {
            key: "What is your client's employment status?",
            value: "Unemployed",
          },
        ],
      },
      {
        heading: "Partner age",
        rows: [{ key: "Is the partner aged 60 or over?", value: "Yes" }],
      },
      {
        heading: "Partner income",
        rows: [
          {
            key: "What is the partner's employment status?",
            value: "Unemployed",
          },
        ],
      },
    ]);
  });

  it("shows partner age for passporting but hides financial answers", () => {
    expect(
      summaries({
        partner: true,
        passporting: true,
        partner_over_60: false,
        partner_employment_status: "in_work",
        partner_incomes: [
          {
            gross_income: 1000,
            income_frequency: "monthly",
            income_tax: 0,
            income_type: "employment",
            national_insurance: 0,
          },
        ],
      }).filter(({ heading }) => heading.startsWith("Partner")),
    ).to.deep.equal([
      {
        heading: "Partner age",
        rows: [{ key: "Is the partner aged 60 or over?", value: "No" }],
      },
    ]);
  });

  it("omits saved partner details after partner removal", () => {
    expect(
      summaries({
        partner: false,
        partner_over_60: true,
        partner_employment_status: "in_work",
        partner_incomes: [
          {
            gross_income: 1000,
            income_frequency: "monthly",
            income_tax: 0,
            income_type: "employment",
            national_insurance: 0,
          },
        ],
      }).filter(({ heading }) => heading.startsWith("Partner")),
    ).to.deep.equal([]);
  });
});