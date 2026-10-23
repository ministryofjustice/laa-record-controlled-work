import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const ANSWERS = {
  adult_dependants: false,
  child_dependants: false,
  childcare_payments_relevant: false,
  client_age: "standard",
  employment_status: "unemployed",
  friends_or_family_relevant: false,
  immigration_or_asylum: false,
  investments_relevant: false,
  legal_aid_payments_relevant: false,
  level_of_help: "controlled",
  maintenance_relevant: false,
  maintenance_payments_relevant: false,
  other_relevant: false,
  partner: false,
  partner_childcare_payments_relevant: false,
  partner_legal_aid_payments_relevant: false,
  partner_maintenance_payments_relevant: false,
  passporting: false,
  pension_relevant: false,
  property_owned: "none",
  additional_property_owned: "none",
  property_or_lodger_relevant: false,
  receives_benefits: false,
  student_finance_relevant: false,
  valuables_relevant: false,
  housing_payments: 0,
  housing_benefit_relevant: false,
} satisfies EligibilityData;

const SUMMARIES = [
  {
    heading: "Client details",
    rows: [
      { key: "What age is your client?", value: "18 to 59" },
      { key: "Does your client have a partner?", value: "No" },
      { key: "Does your client receive a passporting benefit?", value: "No" },
    ],
  },
  {
    heading: "Dependants",
    rows: [
      { key: "Does your client have any child dependants?", value: "No" },
      { key: "Does your client have any adult dependants?", value: "No" },
    ],
  },
  {
    heading: "Client income",
    rows: [
      { key: "What is your client's employment status?", value: "Unemployed" },
    ],
  },
  {
    heading: "Client benefits",
    rows: [
      { key: "Does your client get any non-passporting benefits?", value: "No" },
    ],
  },
  {
    heading: "Client other income",
    rows: [
      { key: "Does your client get financial help from friends or family?", value: "No" },
      { key: "Does your client get maintenance from a former partner?", value: "No" },
      { key: "Does your client get income from a property or lodger?", value: "No" },
      { key: "Does your client get income from pensions?", value: "No" },
      { key: "Does your client get income from student finance?", value: "No" },
      { key: "Does your client get income from other sources?", value: "No" },
    ],
  },
  {
    heading: "Your client's outgoings and deductions",
    rows: [
      { key: "Does your client pay maintenance to a former partner?", value: "No" },
      { key: "Does your client make payments towards legal aid for a criminal case?", value: "No" },
    ],
  },
  {
    heading: "Home client usually lives in",
    rows: [
      {
        key: "Does your client own the home the client usually lives in?",
        value: "No",
      },
    ],
  },
  {
    heading: "Housing costs",
    rows: [
      { key: "Housing payments", value: "£0.00" },
      {
        key: "Is Housing Benefit claimed at the home the client lives in?",
        value: "No",
      },
    ],
  },
  {
    heading: "Client other property",
    rows: [
      {
        key: "Does your client own any other property, a holiday home or land?",
        value: "No",
      },
    ],
  },
  {
    heading: "Client assets",
    rows: [
      { key: "Does your client have any investments?", value: "No" },
      {
        key: "Does your client have valuable items worth £500 or more?",
        value: "No",
      },
    ],
  },
];

function application(overrides: Partial<Application> = {}): Application {
  return getGetApplicationResponseMock({
    eligibility: { data: ANSWERS, result: null },
    meansAssessmentRequired: true,
    ...overrides,
  });
}

describe("saved means answers", () => {
  before(initializeI18nextSync);

  for (const result of [
    null,
    {},
    { result_summary: { overall_result: { result: "ineligible" } } },
    {
      result_summary: {
        gross_income: { combined_total_gross_income: "incompatible" },
        overall_result: { result: "eligible" },
      },
    },
  ]) {
    it("keeps saved summaries when calculations are unavailable", () => {
      const section = toMeansAssessmentSection(
        application({
          eligibility: { data: ANSWERS, result },
        }),
      );

      expect(section?.calculations).to.deep.equal({ status: "unavailable" });
      expect(section?.answerSummaries).to.deep.equal(SUMMARIES);
    });
  }

  it("ignores pending answers and operational metadata", () => {
    const section = toMeansAssessmentSection(
      application({
        eligibility: {
          data: {
            ...ANSWERS,
            api_response: { result: "eligible" },
            early_result: { result: "eligible", type: "gross_income" },
            feature_flags: { export: true },
            pending: {
              client_age: "over_60",
              partner: true,
              passporting: true,
            },
          },
          result: null,
        },
      }),
    );

    expect(section?.answerSummaries).to.deep.equal(SUMMARIES);
  });

  it("returns no summaries without saved eligibility", () => {
    expect(
      toMeansAssessmentSection(application({ eligibility: null })),
    ).to.deep.equal({
      answerSummaries: [],
      calculations: { status: "unavailable" },
    });
  });

  it("omits the whole section when means assessment is not required", () => {
    expect(
      toMeansAssessmentSection(application({ meansAssessmentRequired: false })),
    ).to.equal(null);
  });

  for (const meansAssessmentRequired of [null, undefined]) {
    it("keeps saved answers when the required flag is unspecified", () => {
      expect(
        toMeansAssessmentSection(application({ meansAssessmentRequired }))
          ?.answerSummaries,
      ).to.deep.equal(SUMMARIES);
    });
  }

  it("preserves the saved passported calculation outcome", () => {
    const section = toMeansAssessmentSection(
      application({
        eligibility: {
          data: { ...ANSWERS, passporting: true },
          result: {
            result_summary: { overall_result: { result: "eligible" } },
          },
        },
      }),
    );

    expect(section?.answerSummaries).to.deep.equal([
      {
        heading: "Client details",
        rows: [
          ...SUMMARIES[0].rows.slice(0, 2),
          {
            key: "Does your client receive a passporting benefit?",
            value: "Yes",
          },
        ],
      },
      ...SUMMARIES.filter(({ heading }) =>
        [
          "Home client usually lives in",
          "Client other property",
          "Client assets",
        ].includes(heading),
      ),
    ]);
    expect(section?.calculations).to.deep.equal({
      capital: { status: "not_calculated" },
      capitalContribution: null,
      disposableIncome: { status: "not_calculated" },
      grossIncome: { status: "not_calculated" },
      incomeContribution: null,
      outcome: "eligible",
      status: "ready",
    });
  });
});
