import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const CLIENT_SUMMARY = {
  heading: "Client details",
  rows: [
    { key: "What age is your client?", value: "18 to 59" },
    { key: "Does your client have a partner?", value: "No" },
    { key: "Does your client receive a passporting benefit?", value: "No" },
  ],
};

const BASE_ANSWERS = {
  client_age: "standard",
  employment_status: "unemployed",
  friends_or_family_relevant: false,
  immigration_or_asylum: false,
  investments_relevant: false,
  level_of_help: "controlled",
  maintenance_relevant: false,
  other_relevant: false,
  partner: false,
  passporting: false,
  property_owned: "none",
  additional_property_owned: "none",
  housing_payments: 0,
  housing_benefit_relevant: false,
  pension_relevant: false,
  property_or_lodger_relevant: false,
  receives_benefits: false,
  student_finance_relevant: false,
  valuables_relevant: false,
} satisfies EligibilityData;

const NON_MEANS_TESTED_ROUTES: ReadonlyArray<{
  age: string;
  answers: Partial<EligibilityData>;
  name: string;
}> = [
  {
    age: "18 to 59",
    answers: { asylum_support: true, immigration_or_asylum: true },
    name: "asylum support",
  },
  {
    age: "Under 18",
    answers: {
      client_age: "under_18",
      controlled_legal_representation: true,
    },
    name: "controlled legal representation for an under-18",
  },
  {
    age: "Under 18",
    answers: {
      aggregated_means: false,
      client_age: "under_18",
      controlled_legal_representation: false,
      regular_income: false,
      under_eighteen_assets: false,
    },
    name: "an under-18 with no income or assets",
  },
];

function summaries(overrides: Partial<EligibilityData> = {}) {
  return toMeansAssessmentSection(
    getGetApplicationResponseMock({
      eligibility: { data: { ...BASE_ANSWERS, ...overrides }, result: null },
      meansAssessmentRequired: true,
    }),
  )?.answerSummaries;
}

function dependantSummaries(overrides: Partial<EligibilityData> = {}) {
  return (
    summaries(overrides)?.filter(
      ({ heading }) =>
        heading === "Dependants" || heading.startsWith("Dependant "),
    ) ?? []
  );
}

describe("saved dependant answers", () => {
  before(initializeI18nextSync);

  it("shows dependant counts and repeated incomes in saved order", () => {
    expect(
      dependantSummaries({
        adult_dependants: true,
        adult_dependants_count: 1,
        child_dependants: true,
        child_dependants_count: 2,
        dependant_incomes: [
          { amount: 30, frequency: "every_week" },
          { amount: 60, frequency: "three_months" },
          { amount: 30, frequency: "every_week" },
        ],
        dependants_get_income: true,
      }),
    ).to.deep.equal([
      {
        heading: "Dependants",
        rows: [
          { key: "Does your client have any child dependants?", value: "Yes" },
          { key: "How many child dependants are there?", value: "2" },
          { key: "Does your client have any adult dependants?", value: "Yes" },
          { key: "How many adult dependants are there?", value: "1" },
          { key: "Do any of the dependants aged 16 or over get regular income?", value: "Yes" },
        ],
      },
      {
        heading: "Dependant 1 income",
        rows: [
          {
            key: "When does the dependant normally get this income?",
            value: "Every week",
          },
          { key: "Income", value: "£30.00" },
        ],
      },
      {
        heading: "Dependant 2 income",
        rows: [
          {
            key: "When does the dependant normally get this income?",
            value: "Total in last 3 months",
          },
          { key: "Income", value: "£60.00" },
        ],
      },
      {
        heading: "Dependant 3 income",
        rows: [
          {
            key: "When does the dependant normally get this income?",
            value: "Every week",
          },
          { key: "Income", value: "£30.00" },
        ],
      },
    ]);
  });

  it("shows only the count enabled by each dependant answer", () => {
    expect(
      dependantSummaries({
        adult_dependants: true,
        adult_dependants_count: 2,
        child_dependants: false,
        child_dependants_count: 9,
        dependant_incomes: [{ amount: 20, frequency: "monthly" }],
        dependants_get_income: false,
      }),
    ).to.deep.equal([
      {
        heading: "Dependants",
        rows: [
          { key: "Does your client have any child dependants?", value: "No" },
          { key: "Does your client have any adult dependants?", value: "Yes" },
          { key: "How many adult dependants are there?", value: "2" },
          {
            key: "Do any of the dependants aged 16 or over get regular income?",
            value: "No",
          },
        ],
      },
    ]);
  });

  it("omits income controls when neither dependant type is present", () => {
    expect(
      dependantSummaries({
        adult_dependants: false,
        child_dependants: false,
        dependant_incomes: [{ amount: 20, frequency: "monthly" }],
        dependants_get_income: true,
      }),
    ).to.deep.equal([
      {
        heading: "Dependants",
        rows: [
          { key: "Does your client have any child dependants?", value: "No" },
          { key: "Does your client have any adult dependants?", value: "No" },
        ],
      },
    ]);
  });

  for (const { age, answers, name } of NON_MEANS_TESTED_ROUTES) {
    it(`omits stale dependant answers for ${name}`, () => {
      expect(
        summaries({
          ...answers,
          adult_dependants: true,
          adult_dependants_count: 1,
          child_dependants: true,
          child_dependants_count: 2,
          dependant_incomes: [{ amount: 30, frequency: "every_week" }],
          dependants_get_income: true,
        }),
      ).to.deep.equal([
        {
          heading: "Client details",
          rows: [{ key: "What age is your client?", value: age }],
        },
      ]);
    });
  }

  it("omits dependant answers for passported assessments", () => {
    expect(
      dependantSummaries({
        adult_dependants: true,
        adult_dependants_count: 1,
        child_dependants: true,
        child_dependants_count: 1,
        dependant_incomes: [{ amount: 20, frequency: "monthly" }],
        dependants_get_income: true,
        passporting: true,
      }),
    ).to.deep.equal([]);
  });
});