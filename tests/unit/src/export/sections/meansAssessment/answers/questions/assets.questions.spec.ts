import { expect } from "chai";
import { before, describe, it } from "mocha";

import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";
import { initializeI18nextSync } from "#/lib/i18n.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const BASE_ANSWERS = {
  client_age: "standard",
  immigration_or_asylum: false,
  investments_relevant: false,
  level_of_help: "controlled",
  partner: false,
  partner_investments_relevant: false,
  partner_valuables_relevant: false,
  passporting: false,
  valuables_relevant: false,
} satisfies EligibilityData;

function assetSummaries(overrides: Partial<EligibilityData> = {}) {
  return (
    toMeansAssessmentSection(
      getGetApplicationResponseMock({
        eligibility: {
          data: { ...BASE_ANSWERS, ...overrides },
          result: null,
        },
        meansAssessmentRequired: true,
      }),
    )?.answerSummaries.filter(
      ({ heading }) =>
        heading.toLowerCase().includes("asset") ||
        heading.toLowerCase().includes("account"),
    ) ?? []
  );
}

describe("saved asset answers", () => {
  before(initializeI18nextSync);

  it("preserves repeated accounts and conditionally shows investments and valuables", () => {
    expect(
      assetSummaries({
        bank_accounts: [
          { amount: 250.5, account_in_dispute: true },
          { amount: 0, account_in_dispute: false },
        ],
        investments_relevant: true,
        investments: 1200,
        investments_in_dispute: true,
        valuables_relevant: false,
        valuables: 900,
        valuables_in_dispute: true,
      }),
    ).to.deep.equal([
      {
        heading: "Client bank account 1",
        rows: [
          { key: "Money in bank account", value: "£250.50" },
          { key: "Disputed asset", value: "Yes" },
        ],
      },
      {
        heading: "Client bank account 2",
        rows: [{ key: "Money in bank account", value: "£0.00" }],
      },
      {
        heading: "Client assets",
        rows: [
          { key: "Does your client have any investments?", value: "Yes" },
          { key: "Investments", value: "£1,200.00" },
          { key: "Disputed asset", value: "Yes" },
          {
            key: "Does your client have valuable items worth £500 or more?",
            value: "No",
          },
        ],
      },
    ]);
  });

  it("shows passported client assets and hides removed partner assets", () => {
    const answers = {
      ...BASE_ANSWERS,
      bank_accounts: [{ amount: 100 }],
      partner: true,
      partner_bank_accounts: [{ amount: 200 }],
      partner_investments_relevant: true,
      partner_investments: 300,
      partner_valuables_relevant: false,
      passporting: true,
    } satisfies EligibilityData;

    expect(assetSummaries(answers).map(({ heading }) => heading)).to.include(
      "Partner assets",
    );
    expect(
      assetSummaries({ ...answers, partner: false }).some(({ heading }) =>
        heading.startsWith("Partner"),
      ),
    ).to.equal(false);
  });

  it("hides stale investment values and inapplicable dispute annotations", () => {
    expect(
      assetSummaries({
        immigration_or_asylum: true,
        investments: 750,
        investments_in_dispute: true,
        investments_relevant: false,
        valuables: 0,
        valuables_in_dispute: true,
        valuables_relevant: true,
      }),
    ).to.deep.equal([
      {
        heading: "Client assets",
        rows: [
          { key: "Does your client have any investments?", value: "No" },
          {
            key: "Does your client have valuable items worth £500 or more?",
            value: "Yes",
          },
          { key: "Valuable items", value: "£0.00" },
        ],
      },
    ]);
  });

  it("omits exempt assets and controlled-work vehicle answers", () => {
    expect(
      assetSummaries({
        ...BASE_ANSWERS,
        aggregated_means: false,
        bank_accounts: [{ amount: 500 }],
        client_age: "under_18",
        level_of_help: "controlled",
        regular_income: false,
        under_eighteen_assets: false,
        vehicle_owned: true,
        vehicles: [{ vehicle_value: 10000 }],
      }),
    ).to.deep.equal([]);
    expect(
      assetSummaries({
        vehicle_owned: true,
        vehicles: [{ vehicle_value: 10000 }],
      }).flatMap(({ rows }) => rows.map(({ key }) => key)),
    ).not.to.include("Vehicle value");
  });
});
