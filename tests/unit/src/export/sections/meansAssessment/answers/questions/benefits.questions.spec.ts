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

describe("saved benefit answers", () => {
  before(initializeI18nextSync);

  it("preserves client and partner benefit text, duplicates, amounts, and frequencies", () => {
    const benefitSummaries = summaries({
      benefits: [
        {
          benefit_amount: 215.4,
          benefit_frequency: "monthly",
          benefit_type: "Saved benefit name / award wording",
        },
        {
          benefit_amount: 30,
          benefit_frequency: "every_week",
          benefit_type: "Saved benefit name / award wording",
        },
      ],
      partner_benefits: [
        {
          benefit_amount: 150,
          benefit_frequency: "every_four_weeks",
          benefit_type: "Partner saved benefit wording",
        },
      ],
      partner_receives_benefits: true,
      receives_benefits: true,
    }).filter(({ heading }) => heading.includes("benefit"));

    expect(benefitSummaries.map(({ heading }) => heading)).to.deep.equal([
      "Client benefits",
      "Client benefit 1 details",
      "Client benefit 2 details",
      "Partner benefits",
      "Partner benefit 1 details",
    ]);
    expect(benefitSummaries.map(({ rows }) => rows.map(({ value }) => value)))
      .to.deep.equal([
        ["Yes"],
        ["Saved benefit name / award wording", "£215.40", "Monthly"],
        ["Saved benefit name / award wording", "£30.00", "Every week"],
        ["Yes"],
        ["Partner saved benefit wording", "£150.00", "Every 4 weeks"],
      ]);
  });

  it("hides stale benefit details when benefits are not received", () => {
    expect(
      summaries({
        benefits: [
          {
            benefit_amount: 100,
            benefit_frequency: "monthly",
            benefit_type: "Stale saved text",
          },
        ],
        partner: false,
        partner_benefits: [
          {
            benefit_amount: 200,
            benefit_frequency: "monthly",
            benefit_type: "Removed partner benefit",
          },
        ],
        partner_receives_benefits: true,
        receives_benefits: false,
      }).filter(({ heading }) => heading.includes("benefit")),
    ).to.deep.equal([
      {
        heading: "Client benefits",
        rows: [
          {
            key: "Does your client get any non-passporting benefits?",
            value: "No",
          },
        ],
      },
    ]);
  });
});