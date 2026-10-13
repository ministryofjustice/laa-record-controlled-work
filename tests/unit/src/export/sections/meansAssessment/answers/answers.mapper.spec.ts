import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { expectedAnswerSummaries } from "#tests/unit/src/export/sections/meansAssessment/answers/answers.fixtures.js";
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

function application(overrides: Partial<Application> = {}): Application {
  return getGetApplicationResponseMock({
    eligibility: { data: ANSWERS, result: null },
    meansAssessmentRequired: true,
    ...overrides,
  });
}

describe("saved means answers", () => {
  before(initializeI18nextSync);

  it("groups relevant cards beneath ordered answer sections", () => {
    const section = toMeansAssessmentSection(application());

    expect(
      section?.answerSummaries.map(({ heading, cards }) => [
        heading,
        cards.map(({ heading: cardHeading }) => cardHeading),
      ]),
    ).to.deep.equal([
      ["Client details", ["Client age", "Partner and passporting"]],
      ["Dependants", ["Number of dependants"]],
      [
        "Client income",
        ["Employment status", "Client benefits", "Client other income"],
      ],
      ["Outgoings", ["Client outgoings and deductions"]],
      [
        "Housing and property",
        [
          "Home client usually lives in",
          "Housing costs",
          "Client other property",
        ],
      ],
      ["Assets", ["Client assets"]],
    ]);

    expect(section?.answerSummaries).to.deep.equal(expectedAnswerSummaries);
  });

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
      expect(section?.answerSummaries).to.deep.equal(expectedAnswerSummaries);
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

    expect(section?.answerSummaries).to.deep.equal(expectedAnswerSummaries);
  });

  it("returns no summaries without saved eligibility", () => {
    const section = toMeansAssessmentSection(
      application({ eligibility: null }),
    );

    expect(section?.answerSummaries).to.deep.equal([]);
    expect(section?.calculations).to.deep.equal({ status: "unavailable" });
    expect(section?.outcomeSummary.outcome.heading).to.equal(
      "Financial eligibility outcome unavailable.",
    );
    expect(section?.outcomeSummary.totals).to.equal(null);
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
      ).to.deep.equal(expectedAnswerSummaries);
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

    expect(
      section?.answerSummaries.map(({ heading, cards }) => [
        heading,
        cards.map(({ heading: cardHeading }) => cardHeading),
      ]),
    ).to.deep.equal([
      ["Client details", ["Client age", "Partner and passporting"]],
      [
        "Housing and property",
        ["Home client usually lives in", "Client other property"],
      ],
      ["Assets", ["Client assets"]],
    ]);
    expect(section?.answerSummaries[0].cards[1].rows[1]).to.deep.equal({
      key: "Does your client receive a passporting benefit?",
      value: "Yes",
    });
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
