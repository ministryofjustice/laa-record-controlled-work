import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const BASE_ANSWERS = {
  adult_dependants: false,
  child_dependants: false,
  childcare_payments_relevant: false,
  employment_status: "unemployed",
  immigration_or_asylum: false,
  legal_aid_payments_relevant: false,
  level_of_help: "controlled",
  maintenance_payments_relevant: false,
  partner: false,
  partner_childcare_payments_relevant: false,
  partner_employment_status: "unemployed",
  partner_legal_aid_payments_relevant: false,
  partner_maintenance_payments_relevant: false,
  partner_student_finance_relevant: false,
  passporting: false,
  property_owned: "none",
  housing_payments: 0,
  housing_benefit_relevant: false,
  student_finance_relevant: false,
} satisfies EligibilityData;

function outgoings(overrides: Partial<EligibilityData> = {}) {
  return (
    toMeansAssessmentSection(
      getGetApplicationResponseMock({
        eligibility: {
          data: { ...BASE_ANSWERS, ...overrides },
          result: null,
        },
        meansAssessmentRequired: true,
      }),
    )?.answerSummaries.filter(({ heading }) => heading.includes("outgoings")) ??
    []
  );
}

function childcareRows(answers: Partial<EligibilityData>) {
  return outgoings(answers).flatMap(({ rows }) =>
    rows.filter(({ key }) => key.toLowerCase().includes("childcare")),
  );
}

describe("saved outgoings answers", () => {
  before(initializeI18nextSync);

  it("shows enabled payment details and explicit No answers", () => {
    expect(
      outgoings({
        child_dependants: true,
        student_finance_relevant: true,
        childcare_payments_conditional_value: 0,
        childcare_payments_frequency: "monthly",
        childcare_payments_relevant: true,
        childcare_payments_value: 900,
        legal_aid_payments_conditional_value: 80,
        legal_aid_payments_frequency: "every_week",
        legal_aid_payments_relevant: false,
        legal_aid_payments_value: 700,
        maintenance_payments_conditional_value: 47.5,
        maintenance_payments_frequency: "every_two_weeks",
        maintenance_payments_relevant: true,
        maintenance_payments_value: 500,
      }),
    ).to.deep.equal([
      {
        heading: "Your client's outgoings and deductions",
        rows: [
          { key: "Does your client pay for childcare?", value: "Yes" },
          { key: "Amount", value: "£0.00" },
          { key: "Frequency", value: "Every month" },
          {
            key: "Does your client pay maintenance to a former partner?",
            value: "Yes",
          },
          { key: "Amount", value: "£47.50" },
          { key: "Frequency", value: "Every 2 weeks" },
          {
            key: "Does your client make payments towards legal aid for a criminal case?",
            value: "No",
          },
        ],
      },
    ]);
  });

  it("shows childcare only when every applicable adult qualifies", () => {
    const answers = {
      child_dependants: true,
      employment_status: "in_work",
      incomes: [{ income_type: "employment" }],
      partner: true,
      partner_student_finance_relevant: true,
      childcare_payments_conditional_value: 40,
      childcare_payments_frequency: "monthly",
      childcare_payments_relevant: true,
      maintenance_payments_relevant: false,
      legal_aid_payments_relevant: false,
      partner_childcare_payments_conditional_value: 60,
      partner_childcare_payments_frequency: "total",
      partner_childcare_payments_relevant: true,
      partner_maintenance_payments_relevant: false,
      partner_legal_aid_payments_relevant: false,
    } satisfies Partial<EligibilityData>;
    const summaries = outgoings(answers);

    expect(summaries.map(({ heading }) => heading)).to.deep.equal([
      "Your client's outgoings and deductions",
      "The partner's outgoings and deductions",
    ]);
    expect(
      summaries.map(({ rows }) => rows.map(({ key, value }) => [key, value])),
    ).to.deep.equal([
      [
        ["Does your client pay for childcare?", "Yes"],
        ["Amount", "£40.00"],
        ["Frequency", "Every month"],
        ["Does your client pay maintenance to a former partner?", "No"],
        [
          "Does your client make payments towards legal aid for a criminal case?",
          "No",
        ],
      ],
      [
        ["Does the partner pay for childcare?", "Yes"],
        ["Amount", "£60.00"],
        ["Frequency", "Total in last 3 months"],
        ["Does the partner pay maintenance to a former partner?", "No"],
        [
          "Does the partner make payments towards legal aid for a criminal case?",
          "No",
        ],
      ],
    ]);
  });

  for (const { answers, name } of [
    {
      name: "adult-only dependants",
      answers: {
        adult_dependants: true,
        child_dependants: false,
        employment_status: "in_work",
        incomes: [{ income_type: "employment" }],
        childcare_payments_relevant: true,
      },
    },
    {
      name: "statutory-pay-only employment",
      answers: {
        child_dependants: true,
        employment_status: "in_work",
        incomes: [{ income_type: "statutory_pay" }],
        childcare_payments_relevant: true,
      },
    },
    {
      name: "an ineligible partner",
      answers: {
        child_dependants: true,
        employment_status: "in_work",
        incomes: [{ income_type: "employment" }],
        partner: true,
        partner_employment_status: "in_work",
        partner_incomes: [{ income_type: "statutory_pay" }],
        childcare_payments_relevant: true,
        partner_childcare_payments_relevant: true,
      },
    },
  ] satisfies Array<{ answers: Partial<EligibilityData>; name: string }>) {
    it(`omits childcare for ${name}`, () => {
      expect(childcareRows(answers)).to.deep.equal([]);
    });
  }

  it("hides stale partner payments after partner removal", () => {
    expect(
      outgoings({
        child_dependants: true,
        student_finance_relevant: true,
        partner_childcare_payments_relevant: true,
        partner_childcare_payments_conditional_value: 30,
        partner_childcare_payments_frequency: "monthly",
        partner_maintenance_payments_relevant: true,
        partner_maintenance_payments_conditional_value: 20,
        partner_maintenance_payments_frequency: "monthly",
        partner_legal_aid_payments_relevant: true,
        partner_legal_aid_payments_conditional_value: 10,
        partner_legal_aid_payments_frequency: "monthly",
      }).map(({ heading }) => heading),
    ).to.deep.equal(["Your client's outgoings and deductions"]);
  });
});