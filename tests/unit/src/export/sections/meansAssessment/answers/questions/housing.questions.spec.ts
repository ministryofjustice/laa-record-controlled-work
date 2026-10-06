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
  student_finance_relevant: false,
} satisfies EligibilityData;

const HOUSING_HEADINGS = new Set([
  "Home client usually lives in",
  "Housing costs",
  "Home client lives in equity",
]);

function housing(overrides: Partial<EligibilityData> = {}) {
  return (
    toMeansAssessmentSection(
      getGetApplicationResponseMock({
        eligibility: {
          data: { ...BASE_ANSWERS, ...overrides },
          result: null,
        },
        meansAssessmentRequired: true,
      }),
    )?.answerSummaries.filter(({ heading }) => HOUSING_HEADINGS.has(heading)) ??
    []
  );
}

describe("saved housing and main property answers", () => {
  before(initializeI18nextSync);

  it("shows no-home housing payments and an explicit Housing Benefit No", () => {
    expect(
      housing({
        property_owned: "none",
        housing_payments: 0,
        housing_benefit_relevant: false,
        housing_loan_payments: 900,
        housing_payments_loan_frequency: "monthly",
        rent: 700,
        shared_ownership_mortgage: 200,
        combined_frequency: "every_week",
        house_value: 250000,
      }),
    ).to.deep.equal([
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
    ]);
  });

  it("shows mortgage payments and owned-home equity without stale Housing Benefit", () => {
    expect(
      housing({
        property_owned: "with_mortgage",
        housing_loan_payments: 1200,
        housing_payments_loan_frequency: "every_four_weeks",
        housing_benefit_relevant: true,
        housing_benefit_value: 150,
        housing_benefit_frequency: "monthly",
        housing_payments: 700,
        housing_payments_frequency: "monthly",
        house_value: 310000,
        mortgage: 110000,
        percentage_owned: 50,
      }),
    ).to.deep.equal([
      {
        heading: "Home client usually lives in",
        rows: [
          {
            key: "Does your client own the home the client usually lives in?",
            value: "Yes, with a mortgage or loan",
          },
        ],
      },
      {
        heading: "Housing costs",
        rows: [
          {
            key: "What are the mortgage or loan payments for the home the client usually lives in?",
            value: "£1,200.00",
          },
          { key: "Frequency", value: "Every 4 weeks" },
        ],
      },
      {
        heading: "Home client lives in equity",
        rows: [
          { key: "Estimated value", value: "£310,000.00" },
          { key: "Outstanding mortgage", value: "£110,000.00" },
          { key: "Percentage share owned", value: "50%" },
        ],
      },
    ]);
  });

  it("keeps shared-ownership costs, landlord answer, and Housing Benefit in order", () => {
    expect(
      housing({
        partner: true,
        property_owned: "shared_ownership",
        property_landlord: false,
        rent: 800,
        shared_ownership_mortgage: 400,
        combined_frequency: "monthly",
        housing_benefit_relevant: true,
        housing_benefit_value: 100,
        housing_benefit_frequency: "every_two_weeks",
        receives_benefits: false,
        housing_payments: 900,
        housing_loan_payments: 750,
        housing_payments_loan_frequency: "monthly",
        house_value: 280000,
        mortgage: 90000,
        percentage_owned: 25,
      }),
    ).to.deep.equal([
      {
        heading: "Home client usually lives in",
        rows: [
          {
            key: "Does your client or their partner own the home the client lives in?",
            value: "Yes, through a shared ownership scheme",
          },
          { key: "Is the landlord the only other joint-owner?", value: "No" },
        ],
      },
      {
        heading: "Housing costs",
        rows: [
          { key: "Rent", value: "£800.00" },
          { key: "Frequency", value: "Every month" },
          { key: "Mortgage", value: "£400.00" },
          { key: "Frequency", value: "Every month" },
          { key: "Housing Benefit", value: "£100.00" },
          { key: "Frequency", value: "Every 2 weeks" },
        ],
      },
      {
        heading: "Home client lives in equity",
        rows: [
          { key: "Estimated value", value: "£280,000.00" },
          { key: "Outstanding mortgage", value: "£90,000.00" },
          { key: "Percentage share owned", value: "25%" },
        ],
      },
    ]);
  });

  it("omits housing costs for outright ownership and retains property details", () => {
    expect(
      housing({
        property_owned: "outright",
        property_landlord: true,
        housing_payments: 500,
        housing_payments_frequency: "monthly",
        housing_benefit_relevant: false,
        house_value: 425000,
        mortgage: 30000,
        percentage_owned: 100,
      }),
    ).to.deep.equal([
      {
        heading: "Home client usually lives in",
        rows: [
          {
            key: "Does your client own the home the client usually lives in?",
            value: "Yes, owned outright",
          },
        ],
      },
      {
        heading: "Home client lives in equity",
        rows: [
          { key: "Estimated value", value: "£425,000.00" },
          { key: "Percentage share owned", value: "100%" },
        ],
      },
    ]);
  });

  it("shows ownership and equity on passporting, but omits housing costs", () => {
    expect(
      housing({
        passporting: true,
        property_owned: "with_mortgage",
        housing_loan_payments: 900,
        housing_payments_loan_frequency: "monthly",
        house_value: 300000,
        mortgage: 100000,
        percentage_owned: 75,
      }),
    ).to.deep.equal([
      {
        heading: "Home client usually lives in",
        rows: [
          {
            key: "Does your client own the home the client usually lives in?",
            value: "Yes, with a mortgage or loan",
          },
        ],
      },
      {
        heading: "Home client lives in equity",
        rows: [
          { key: "Estimated value", value: "£300,000.00" },
          { key: "Outstanding mortgage", value: "£100,000.00" },
          { key: "Percentage share owned", value: "75%" },
        ],
      },
    ]);
  });
});