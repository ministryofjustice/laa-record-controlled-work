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
  client_age: "standard",
  immigration_or_asylum: false,
  level_of_help: "controlled",
  partner: false,
  passporting: false,
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
